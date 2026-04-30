import type { BehaviorAnalysis } from "#/domain/behavior-analysis/behavior-analysis.ts"
import type { EmailSequenceRepository } from "#/domain/email-sequence/email-sequence-repository.ts"
import type { Lead } from "#/domain/lead/lead.ts"
import type { LeadRepository } from "#/domain/lead/lead-repository.ts"
import type { AIService } from "#/domain/ports/ai-service.ts"
import type { EmailService } from "#/domain/ports/email-service.ts"
import type { Logger } from "#/domain/ports/logger.ts"

interface EmailUseCaseDeps {
	leadRepo: LeadRepository
	sequenceRepo: EmailSequenceRepository
	ai: AIService
	emailService: EmailService
	logger: Logger
	senderName: string
	senderCompany: string
}

/** Send the initial (1st) email to a lead */
export function makeSendInitialEmailUseCase(deps: EmailUseCaseDeps) {
	return async (lead: Lead, analysis: BehaviorAnalysis): Promise<void> => {
		// 1. Generate 3-email sequence
		deps.logger.info({ leadId: lead.id }, "Generating email sequence")
		const generated = await deps.ai.generateEmailSequence(lead, analysis, {
			name: deps.senderName,
			company: deps.senderCompany,
		})

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

		// 3. Convert to HTML
		deps.logger.info({ leadId: lead.id }, "Converting email to HTML")
		const htmlContent = await deps.ai.convertToHtml(firstEmail.content)
		await deps.sequenceRepo.updateHtml(firstEmail.id, htmlContent)

		// 4. Pick subject line
		const subject = await deps.ai.pickSubjectLine(lead, firstEmail.subjectLines)

		// 5. Send via Resend
		deps.logger.info({ leadId: lead.id, to: lead.email }, "Sending first email")
		const result = await deps.emailService.send({
			to: lead.email,
			subject,
			html: htmlContent,
			leadId: lead.id,
			stage: 1,
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

		// 2. Convert to HTML if not already
		let html = template.htmlContent
		if (!html) {
			html = await deps.ai.convertToHtml(template.content)
			await deps.sequenceRepo.updateHtml(template.id, html)
		}

		// 3. Pick subject line
		const subject = await deps.ai.pickSubjectLine(lead, template.subjectLines)

		// 4. Send as reply in thread
		const result = await deps.emailService.replyInThread({
			to: lead.email,
			subject,
			html,
			originalMessageId: lead.latestMessageId!,
			previousRefs: lead.messageIds,
			leadId: lead.id,
			stage: nextStage,
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
