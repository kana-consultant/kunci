import type { InboundMailbox } from "#/domain/ports/inbound-mailbox.ts"
import type { Logger } from "#/domain/ports/logger.ts"

interface Deps {
	mailbox: InboundMailbox
	handleReply: (payload: {
		fromEmail: string
		subject: string
		textBody: string
		messageId: string
	}) => Promise<unknown>
	logger: Logger
}

export interface PollResult {
	fetched: number
	processed: number
	failed: number
}

/**
 * Pulls all unseen messages from the configured mailbox and routes each
 * one to the existing reply handler. Marks a message as `\Seen` only
 * *after* handleReply resolves so a crash mid-process leaves the message
 * for the next poll instead of silently dropping it.
 */
export function makePollInboundMailboxUseCase(deps: Deps) {
	return async (): Promise<PollResult> => {
		const messages = await deps.mailbox.fetchUnseen()
		if (messages.length === 0) {
			return { fetched: 0, processed: 0, failed: 0 }
		}

		let processed = 0
		let failed = 0
		for (const msg of messages) {
			try {
				await deps.handleReply({
					fromEmail: msg.fromEmail,
					subject: msg.subject,
					textBody: msg.textBody || msg.htmlBody || "(empty body)",
					messageId: msg.messageId,
				})
				await deps.mailbox.markSeen(msg.uid)
				processed++
			} catch (err) {
				failed++
				deps.logger.error(
					{ err, uid: msg.uid, fromEmail: msg.fromEmail },
					"Failed to handle inbound message; leaving unseen for retry",
				)
			}
		}

		deps.logger.info(
			{ fetched: messages.length, processed, failed },
			"Inbound mailbox poll completed",
		)

		return { fetched: messages.length, processed, failed }
	}
}
