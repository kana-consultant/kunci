import { ImapFlow } from "imapflow"
import { simpleParser } from "mailparser"
import type {
	InboundMailbox,
	InboundMessage,
} from "#/domain/ports/inbound-mailbox.ts"
import type { Logger } from "#/domain/ports/logger.ts"

export interface ImapInboundConfig {
	host: string
	port: number
	secure: boolean
	user: string
	password: string
	mailbox: string
	/** Cap how many unseen messages we pull per poll cycle. */
	batchSize: number
	logger: Logger
}

/**
 * IMAP-backed inbound adapter. One ImapFlow client is created per poll so
 * connection failures (auth drift, IDLE timeouts) don't accumulate state —
 * the next poll just opens a fresh connection. For high-volume inboxes
 * a persistent IDLE connection would be better, but our expected load is
 * 10-100 inbound/day so per-poll connections are fine.
 */
export function createImapInbound(config: ImapInboundConfig): InboundMailbox {
	// markSeen needs to reach the connection that pulled the message, but
	// we don't keep one open across calls. Instead we accumulate UIDs to
	// mark on the next fetch — or just mark inline inside fetchUnseen via
	// the BODY[] fetch's `seen` flag. We do the inline approach (set \Seen
	// only after the use case finishes), which means the caller must
	// invoke markSeen for every successfully-processed message.
	//
	// To make this work without holding a connection, markSeen opens a new
	// short-lived connection and sets the \Seen flag by UID.
	return {
		async fetchUnseen(): Promise<InboundMessage[]> {
			const client = new ImapFlow({
				host: config.host,
				port: config.port,
				secure: config.secure,
				auth: { user: config.user, pass: config.password },
				logger: false,
			})

			try {
				await client.connect()
				await client.mailboxOpen(config.mailbox)

				const messages: InboundMessage[] = []
				let count = 0
				for await (const msg of client.fetch(
					{ seen: false },
					{ source: true, envelope: true, uid: true },
				)) {
					if (count >= config.batchSize) break
					count++

					const raw = msg.source
					if (!raw) continue

					try {
						const parsed = await simpleParser(raw)
						const fromEmail =
							parsed.from?.value?.[0]?.address ??
							msg.envelope?.from?.[0]?.address ??
							""
						if (!fromEmail) continue

						messages.push({
							uid: msg.uid,
							fromEmail,
							subject:
								parsed.subject ?? msg.envelope?.subject ?? "(no subject)",
							textBody: parsed.text ?? "",
							htmlBody: typeof parsed.html === "string" ? parsed.html : null,
							messageId: parsed.messageId ?? "",
							inReplyTo: parsed.inReplyTo ?? null,
							references: normalizeReferences(parsed.references),
							receivedAt: parsed.date ?? new Date(),
						})
					} catch (err) {
						config.logger.warn(
							{ uid: msg.uid, err },
							"Failed to parse inbound message",
						)
					}
				}

				return messages
			} finally {
				try {
					await client.logout()
				} catch {
					/* ignore — best effort */
				}
			}
		},

		async markSeen(uid: number): Promise<void> {
			const client = new ImapFlow({
				host: config.host,
				port: config.port,
				secure: config.secure,
				auth: { user: config.user, pass: config.password },
				logger: false,
			})

			try {
				await client.connect()
				const lock = await client.getMailboxLock(config.mailbox)
				try {
					await client.messageFlagsAdd({ uid: String(uid) }, ["\\Seen"], {
						uid: true,
					})
				} finally {
					lock.release()
				}
			} finally {
				try {
					await client.logout()
				} catch {
					/* ignore */
				}
			}
		},
	}
}

function normalizeReferences(refs: string | string[] | undefined): string[] {
	if (!refs) return []
	if (Array.isArray(refs)) return refs
	return refs.split(/\s+/).filter(Boolean)
}
