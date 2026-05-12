import type {
	CompanyProfileFileMeta,
	CompanyProfileMode,
} from "#/application/company-profile/use-cases.ts"
import { AppError } from "#/application/shared/errors.ts"
import type { SettingsService } from "#/application/shared/settings-service.ts"
import type { BehaviorAnalysis } from "#/domain/behavior-analysis/behavior-analysis.ts"
import type { EmailSequenceRepository } from "#/domain/email-sequence/email-sequence-repository.ts"
import type { Lead } from "#/domain/lead/lead.ts"
import type { LeadRepository } from "#/domain/lead/lead-repository.ts"
import type { OptOutRepository } from "#/domain/opt-out/opt-out-repository.ts"
import type { AIService } from "#/domain/ports/ai-service.ts"
import type {
	EmailAttachment,
	EmailService,
} from "#/domain/ports/email-service.ts"
import type { FileStorage } from "#/domain/ports/file-storage.ts"
import type { Logger } from "#/domain/ports/logger.ts"
import { SETTING_KEYS } from "#/domain/settings/setting-keys.ts"
import {
	buildCompanyProfileCtaHtml,
	injectCompanyProfileCta,
} from "./company-profile-cta.ts"
import { appendFooterToHtml, buildFooterHtml } from "./email-footer.ts"

export interface SendEmailConfig {
	senderName: string
	senderCompany: string
}

interface EmailUseCaseDeps {
	leadRepo: LeadRepository
	sequenceRepo: EmailSequenceRepository
	optOutRepo: OptOutRepository
	ai: AIService
	emailService: EmailService
	settings: SettingsService
	fileStorage: FileStorage
	logger: Logger
	buildUnsubscribeUrl: (email: string) => string
	config: SendEmailConfig
}

interface CompanyProfileAttachmentResult {
	html: string
	attachments: EmailAttachment[]
}

async function applyCompanyProfile(
	deps: EmailUseCaseDeps,
	html: string,
	language: string | null,
): Promise<CompanyProfileAttachmentResult> {
	const mode = await deps.settings.get<CompanyProfileMode>(
		SETTING_KEYS.BUSINESS_COMPANY_PROFILE_MODE,
		"disabled",
	)

	if (mode === "url") {
		const url = (
			await deps.settings.get<string>(
				SETTING_KEYS.BUSINESS_COMPANY_PROFILE_URL,
				"",
			)
		)?.trim()
		if (!url) {
			deps.logger.warn(
				{},
				"Company profile mode is 'url' but no URL is configured — skipping inject",
			)
			return { html, attachments: [] }
		}
		const cta = buildCompanyProfileCtaHtml({ url, language })
		return { html: injectCompanyProfileCta(html, cta), attachments: [] }
	}

	if (mode === "file") {
		const meta = await deps.settings.get<CompanyProfileFileMeta | null>(
			SETTING_KEYS.BUSINESS_COMPANY_PROFILE_FILE,
			null,
		)
		if (!meta?.storageKey) {
			deps.logger.warn(
				{},
				"Company profile mode is 'file' but no file is uploaded — skipping attachment",
			)
			return { html, attachments: [] }
		}
		try {
			const blob = await deps.fileStorage.get(meta.storageKey)
			return {
				html,
				attachments: [
					{
						filename: meta.fileName,
						content: blob.bytes,
						contentType: blob.mime || meta.mime,
					},
				],
			}
		} catch (err) {
			deps.logger.error(
				{ err, storageKey: meta.storageKey },
				"Failed to load company profile file — sending email without attachment",
			)
			return { html, attachments: [] }
		}
	}

	return { html, attachments: [] }
}

/** Send the initial (1st) email to a lead */
export function makeSendInitialEmailUseCase(deps: EmailUseCaseDeps) {
	return async (lead: Lead, analysis: BehaviorAnalysis): Promise<void> => {
		if (await deps.optOutRepo.has(lead.email)) {
			deps.logger.info(
				{ leadId: lead.id, email: lead.email },
				"Lead opted out — skipping initial email",
			)
			await deps.leadRepo.update(lead.id, {
				replyStatus: "opted_out",
				completedReason: "opted_out",
			})
			return
		}

		// 1. Generate 3-email sequence
		deps.logger.info({ leadId: lead.id }, "Generating email sequence")
		const generated = await deps.ai.generateEmailSequence(lead, analysis)

		// 2. Save sequences to DB
		const sequences = await deps.sequenceRepo.saveAll(
			lead.id,
			generated.emails.map((e) => ({
				leadId: lead.id,
				emailNumber: e.emailNumber as 1 | 2 | 3,
				subjectLines: e.subjectLines,
				content: e.content,
				cta: e.callToAction,
				psychologicalTrigger: e.psychologicalTrigger,
			})),
		)

		const firstEmail = sequences.find((s) => s.emailNumber === 1)
		if (!firstEmail) throw new Error("First email not found in sequence")

		// 3. Convert to HTML + append compliance footer
		deps.logger.info({ leadId: lead.id }, "Converting email to HTML")
		const aiHtml = await deps.ai.convertToHtml(firstEmail.content)
		const withFooter = appendFooterToHtml(
			aiHtml,
			buildFooterHtml({
				unsubscribeUrl: deps.buildUnsubscribeUrl(lead.email),
				senderName: deps.config.senderName,
				senderCompany: deps.config.senderCompany,
				language: lead.language,
			}),
		)

		// 3b. Apply company-profile setting (URL CTA inject or file attachment).
		// Only the FIRST email gets the profile — follow-ups stay lean.
		const profile = await applyCompanyProfile(deps, withFooter, lead.language)
		const htmlContent = profile.html
		await deps.sequenceRepo.updateHtml(firstEmail.id, htmlContent)

		// 4. Pick subject line
		const subject = await deps.ai.pickSubjectLine(lead, firstEmail.subjectLines)

		// 5. Send via Resend
		deps.logger.info(
			{
				leadId: lead.id,
				to: lead.email,
				attachments: profile.attachments.length,
			},
			"Sending first email",
		)
		const result = await deps.emailService.send({
			to: lead.email,
			subject,
			html: htmlContent,
			leadId: lead.id,
			stage: 1,
			unsubscribeUrl: deps.buildUnsubscribeUrl(lead.email),
			attachments: profile.attachments.length
				? profile.attachments
				: undefined,
		})

		// 6. Mark sent + update lead
		await deps.sequenceRepo.markSent(firstEmail.id)
		await deps.leadRepo.update(lead.id, {
			stage: 1,
			replyStatus: "awaiting",
			latestMessageId: result.messageId,
			messageIds: [result.messageId],
			lastEmailSentAt: result.sentAt,
		})

		deps.logger.info(
			{ leadId: lead.id, messageId: result.messageId },
			"First email sent",
		)
	}
}

/** Send a follow-up email (stage 1→2 or 2→3) */
export function makeSendFollowupUseCase(deps: EmailUseCaseDeps) {
	return async (lead: Lead): Promise<void> => {
		if (await deps.optOutRepo.has(lead.email)) {
			deps.logger.info(
				{ leadId: lead.id, email: lead.email },
				"Lead opted out — skipping follow-up",
			)
			await deps.leadRepo.update(lead.id, {
				replyStatus: "opted_out",
				completedReason: "opted_out",
			})
			return
		}

		const nextStage = (lead.stage + 1) as 1 | 2 | 3
		if (nextStage > 3) {
			deps.logger.info(
				{ leadId: lead.id },
				"All 3 emails sent, marking completed",
			)
			await deps.leadRepo.update(lead.id, { replyStatus: "completed" })
			return
		}

		// 1. Get email template for next stage
		const template = await deps.sequenceRepo.getByStage(lead.id, nextStage)
		if (!template) {
			deps.logger.warn(
				{ leadId: lead.id, nextStage },
				"No email template found for stage",
			)
			return
		}

		// 2. Convert to HTML if not already + ensure compliance footer
		const footer = buildFooterHtml({
			unsubscribeUrl: deps.buildUnsubscribeUrl(lead.email),
			senderName: deps.config.senderName,
			senderCompany: deps.config.senderCompany,
			language: lead.language,
		})
		let html = template.htmlContent
		if (!html) {
			const aiHtml = await deps.ai.convertToHtml(template.content)
			html = appendFooterToHtml(aiHtml, footer)
			await deps.sequenceRepo.updateHtml(template.id, html)
		} else if (!html.includes("/unsubscribe/")) {
			html = appendFooterToHtml(html, footer)
			await deps.sequenceRepo.updateHtml(template.id, html)
		}

		// 3. Pick subject line
		const subject = await deps.ai.pickSubjectLine(lead, template.subjectLines)

		// 4. Send as reply in thread
		if (!lead.latestMessageId) {
			throw new AppError(
				"INTERNAL_ERROR",
				`Lead ${lead.id} has no latestMessageId; cannot thread follow-up`,
			)
		}
		const result = await deps.emailService.replyInThread({
			to: lead.email,
			subject,
			html,
			originalMessageId: lead.latestMessageId,
			previousRefs: lead.messageIds,
			leadId: lead.id,
			stage: nextStage,
			unsubscribeUrl: deps.buildUnsubscribeUrl(lead.email),
		})

		// 5. Update lead
		await deps.sequenceRepo.markSent(template.id)
		await deps.leadRepo.update(lead.id, {
			stage: nextStage,
			latestMessageId: result.messageId,
			messageIds: [...lead.messageIds, result.messageId],
			lastEmailSentAt: result.sentAt,
		})

		deps.logger.info(
			{ leadId: lead.id, stage: nextStage, messageId: result.messageId },
			"Follow-up email sent",
		)
	}
}
