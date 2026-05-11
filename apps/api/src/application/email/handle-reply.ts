import type { SettingsService } from "#/application/shared/settings-service.ts"
import type { EmailMessage } from "#/domain/email-message/email-message.ts"
import type { EmailMessageRepository } from "#/domain/email-message/email-message-repository.ts"
import type { CompletedReason } from "#/domain/lead/lead.ts"
import type { LeadRepository } from "#/domain/lead/lead-repository.ts"
import type {
	AIService,
	ChatTurn,
	IntentClassification,
} from "#/domain/ports/ai-service.ts"
import type { EmailService } from "#/domain/ports/email-service.ts"
import type { Logger } from "#/domain/ports/logger.ts"
import type { NotificationService } from "#/domain/ports/notification-service.ts"
import { SETTING_KEYS } from "#/domain/settings/setting-keys.ts"

export interface HandleReplyDependencies {
	leadRepo: LeadRepository
	messageRepo: EmailMessageRepository
	ai: AIService
	emailService: EmailService
	settings: SettingsService
	notifier: NotificationService
	logger: Logger
	scheduleDelayedSend?: (fn: () => Promise<void>, delayMs: number) => void
}

export function makeHandleReplyUseCase(deps: HandleReplyDependencies) {
	const scheduleSend =
		deps.scheduleDelayedSend ??
		((fn, delayMs) => {
			setTimeout(() => {
				fn().catch((err) =>
					deps.logger.error({ err }, "Delayed auto-reply send failed"),
				)
			}, delayMs)
		})

	return async function handleReply(payload: {
		fromEmail: string
		subject: string
		textBody: string
		messageId: string
	}) {
		deps.logger.info(
			{ email: payload.fromEmail },
			"Handling inbound reply (chat mode)",
		)

		const lead = await deps.leadRepo.findByEmail(payload.fromEmail)
		if (!lead) {
			deps.logger.warn(
				{ email: payload.fromEmail },
				"Received reply from unknown lead",
			)
			return { status: "ignored", reason: "unknown_lead" }
		}

		if (lead.replyStatus === "completed") {
			deps.logger.info(
				{ leadId: lead.id, completedReason: lead.completedReason },
				"Lead completed, ignoring reply",
			)
			return { status: "ignored", reason: "lead_completed" }
		}

		if (lead.stage === 0) {
			deps.logger.warn(
				{ leadId: lead.id },
				"Got reply but no outbound email sent yet — skipping chat reply",
			)
			return { status: "ignored", reason: "no_outbound_yet" }
		}

		// Persist inbound message
		await deps.messageRepo.append({
			leadId: lead.id,
			direction: "inbound",
			subject: payload.subject,
			textBody: payload.textBody,
			messageId: payload.messageId,
			inReplyTo: lead.latestMessageId,
		})

		// Mark replied so daily follow-up cron doesn't try to send sequence emails
		await deps.leadRepo.update(lead.id, { replyStatus: "replied" })

		// Load thread + classify intent
		const thread = await deps.messageRepo.listByLeadId(lead.id)
		const history = buildChatHistory(thread)

		let intent: IntentClassification
		try {
			intent = await deps.ai.classifyIntent(lead, history, payload.textBody)
		} catch (err) {
			deps.logger.error(
				{ err, leadId: lead.id },
				"Intent classification failed; defaulting to neutral",
			)
			intent = {
				intent: "neutral",
				confidence: 0,
				reasoning: "classifier_error",
			}
		}

		deps.logger.info(
			{ leadId: lead.id, intent: intent.intent, confidence: intent.confidence },
			"Classified reply intent",
		)

		// Persist intent on the latest inbound row (refetch and update via raw append is awkward;
		// simpler: log it. For full audit add an update-intent op later.)

		// Terminal intents → stop loop
		const terminalReason = pickTerminalReason(intent.intent)
		if (terminalReason) {
			await completeLead(deps, lead.id, terminalReason, intent)
			return { status: "success", action: "completed", reason: terminalReason }
		}

		// Hard cap check
		const maxTurns = await deps.settings.get<number>(
			SETTING_KEYS.AUTO_REPLY_MAX_TURNS,
			6,
		)
		if (lead.autoReplyTurns >= maxTurns) {
			await completeLead(deps, lead.id, "cap_reached", intent)
			deps.logger.info(
				{ leadId: lead.id, turns: lead.autoReplyTurns, maxTurns },
				"Auto-reply turn cap reached; marking completed",
			)
			return { status: "success", action: "cap_reached" }
		}

		// Generate chat reply
		let chatReply: { subject: string; content: string }
		try {
			chatReply = await deps.ai.generateChatReply(
				lead,
				history,
				payload.textBody,
			)
		} catch (err) {
			deps.logger.error({ err, leadId: lead.id }, "Chat reply generation failed")
			await deps.leadRepo.update(lead.id, { replyStatus: "pending" })
			throw err
		}

		const htmlContent = await deps.ai.convertToHtml(chatReply.content)

		if (!lead.latestMessageId) {
			deps.logger.error(
				{ leadId: lead.id },
				"Cannot thread reply: lead has no latestMessageId",
			)
			await deps.leadRepo.update(lead.id, { replyStatus: "pending" })
			return { status: "failed", reason: "no_thread_anchor" }
		}

		// Schedule jittered delayed send
		const minMs = await deps.settings.get<number>(
			SETTING_KEYS.AUTO_REPLY_DELAY_MIN_MS,
			180_000,
		)
		const maxMs = await deps.settings.get<number>(
			SETTING_KEYS.AUTO_REPLY_DELAY_MAX_MS,
			900_000,
		)
		const delayMs = jitter(minMs, maxMs)

		const leadIdForSend = lead.id
		scheduleSend(async () => {
			const fresh = await deps.leadRepo.findById(leadIdForSend)
			if (!fresh) return
			if (fresh.replyStatus === "completed") {
				deps.logger.info(
					{ leadId: leadIdForSend },
					"Lead became completed during delay; skipping send",
				)
				return
			}
			if (!fresh.latestMessageId) {
				deps.logger.warn(
					{ leadId: leadIdForSend },
					"Lead lost latestMessageId during delay; skipping send",
				)
				return
			}

			const result = await deps.emailService.replyInThread({
				to: fresh.email,
				subject: chatReply.subject,
				html: htmlContent,
				originalMessageId: fresh.latestMessageId,
				previousRefs: fresh.messageIds,
				leadId: fresh.id,
				stage: fresh.stage,
			})

			await deps.messageRepo.append({
				leadId: fresh.id,
				direction: "outbound",
				subject: chatReply.subject,
				textBody: chatReply.content,
				htmlBody: htmlContent,
				messageId: result.messageId,
				inReplyTo: fresh.latestMessageId,
			})

			await deps.leadRepo.update(fresh.id, {
				latestMessageId: result.messageId,
				messageIds: [...fresh.messageIds, result.messageId],
				lastEmailSentAt: result.sentAt,
				autoReplyTurns: fresh.autoReplyTurns + 1,
				replyStatus: "awaiting",
			})

			deps.logger.info(
				{ leadId: fresh.id, turns: fresh.autoReplyTurns + 1, delayMs },
				"Auto-reply sent",
			)
		}, delayMs)

		deps.logger.info(
			{ leadId: lead.id, delayMs, intent: intent.intent },
			"Auto-reply queued with jittered delay",
		)

		return {
			status: "success",
			action: "queued",
			delayMs,
			intent: intent.intent,
		}
	}
}

function buildChatHistory(messages: EmailMessage[]): ChatTurn[] {
	return messages.map((m) => ({
		role: m.direction === "inbound" ? ("lead" as const) : ("agent" as const),
		text: m.textBody,
	}))
}

function pickTerminalReason(
	intent: IntentClassification["intent"],
): CompletedReason | null {
	if (intent === "interested") return "won"
	if (intent === "unsubscribe") return "opted_out"
	if (intent === "not_interested") return "not_interested"
	return null
}

async function completeLead(
	deps: HandleReplyDependencies,
	leadId: string,
	reason: CompletedReason,
	intent: IntentClassification,
) {
	await deps.leadRepo.update(leadId, {
		replyStatus: "completed",
		completedReason: reason,
	})
	try {
		await deps.notifier.send({
			type: "lead.completed",
			leadId,
			reason,
			intent: intent.intent,
			confidence: intent.confidence,
			notes: intent.reasoning,
		})
	} catch (err) {
		deps.logger.warn({ err }, "Failed to notify on lead completion")
	}
}

function jitter(minMs: number, maxMs: number): number {
	if (maxMs <= minMs) return minMs
	return minMs + Math.floor(Math.random() * (maxMs - minMs))
}
