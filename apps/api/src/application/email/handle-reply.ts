import type { LeadRepository } from "#/domain/lead/lead-repository.ts"
import type { EmailSequenceRepository } from "#/domain/email-sequence/email-sequence-repository.ts"
import type { AIService } from "#/domain/ports/ai-service.ts"
import type { EmailService } from "#/domain/ports/email-service.ts"
import { logger } from "#/infrastructure/observability/logger.ts"

export interface HandleReplyDependencies {
	leadRepo: LeadRepository
	sequenceRepo: EmailSequenceRepository
	ai: AIService
	emailService: EmailService
}

export function makeHandleReplyUseCase(deps: HandleReplyDependencies) {
	return async function handleReply(payload: {
		fromEmail: string
		subject: string
		textBody: string
		messageId: string
	}) {
		logger.info({ email: payload.fromEmail }, "Handling inbound reply")

		// 1. Find lead
		const lead = await deps.leadRepo.findByEmail(payload.fromEmail)
		if (!lead) {
			logger.warn({ email: payload.fromEmail }, "Received reply from unknown lead")
			return { status: "ignored", reason: "unknown_lead" }
		}

		if (lead.replyStatus === "completed") {
			logger.info({ leadId: lead.id }, "Lead is already completed, ignoring reply")
			return { status: "ignored", reason: "lead_completed" }
		}

		// Update status to replied immediately so cron jobs don't send follow-ups
		await deps.leadRepo.update(lead.id, { replyStatus: "replied" })

		// 2. We are in flow 2. Determine which template to use for personalization
		// If stage is 1, we use sequence 2. If stage is 2, we use sequence 3.
		// If stage is 0 or 3, we don't have a specific sequence to fall back to.
		const nextEmailNumber = lead.stage === 1 ? 2 : lead.stage === 2 ? 3 : null

		if (!nextEmailNumber) {
			logger.info({ leadId: lead.id, stage: lead.stage }, "Lead replied but no next sequence available, human intervention needed")
			// We can mark them as awaiting manual action
			return { status: "success", action: "manual_intervention_required" }
		}

		// Get the next sequence template
		const sequence = await deps.sequenceRepo.getByStage(lead.id, nextEmailNumber as 1 | 2 | 3)
		if (!sequence) {
			logger.error({ leadId: lead.id, emailNumber: nextEmailNumber }, "Next sequence not found")
			return { status: "failed", reason: "sequence_not_found" }
		}

		// 3. Personalize the reply using AI
		try {
			logger.info({ leadId: lead.id }, "Personalizing reply via AI")
			const personalized = await deps.ai.personalizeReply(lead, payload.textBody, {
				content: sequence.content,
				cta: sequence.cta,
				psychologicalTrigger: sequence.psychologicalTrigger,
			})

			// 4. Convert AI output to HTML
			const htmlContent = await deps.ai.convertToHtml(personalized.content)

			// 5. Send reply via Resend (in the existing email thread)
			const result = await deps.emailService.replyInThread({
				to: lead.email,
				subject: personalized.subject,
				html: htmlContent,
				originalMessageId: lead.latestMessageId!,
				previousRefs: lead.messageIds,
				leadId: lead.id,
				stage: (lead.stage + 1) as 1 | 2 | 3,
			})

			// 6. Update lead state
			await deps.leadRepo.update(lead.id, {
				stage: (lead.stage + 1) as 1 | 2 | 3,
				latestMessageId: result.messageId,
				messageIds: [...lead.messageIds, result.messageId],
				lastEmailSentAt: result.sentAt,
				replyStatus: "awaiting", // Put them back in the funnel
			})

			// Update sequence as sent
			await deps.sequenceRepo.markSent(sequence.id)

			logger.info({ leadId: lead.id }, "Successfully processed reply and sent personalized follow-up")
			return { status: "success", action: "auto_replied" }
		} catch (error) {
			logger.error({ error, leadId: lead.id }, "Failed to process reply")
			// Update status to pending so it can be retried or manually handled
			await deps.leadRepo.update(lead.id, { replyStatus: "pending" })
			throw error
		}
	}
}
