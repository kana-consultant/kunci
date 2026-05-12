/**
 * Port for pulling inbound emails from an external mailbox (IMAP, Gmail API,
 * etc.). Used as a fallback when the email provider's webhook-based inbound
 * delivery isn't configured (e.g. Resend Inbound MX not wired up for a domain).
 *
 * Implementations should mark messages as read/seen *after* the application
 * has successfully accepted them, so a crash mid-process leaves the message
 * available for the next poll instead of silently dropping it.
 */
export interface InboundMailbox {
	/**
	 * Fetch all unseen messages from the configured inbox.
	 * Implementations decide whether to limit per batch.
	 */
	fetchUnseen(): Promise<InboundMessage[]>

	/** Mark a previously-returned message as seen so it isn't reprocessed. */
	markSeen(uid: number): Promise<void>
}

export interface InboundMessage {
	/** IMAP UID (or provider-specific id) — used by markSeen */
	uid: number
	fromEmail: string
	subject: string
	textBody: string
	htmlBody: string | null
	/** Message-ID header of this inbound message */
	messageId: string
	/** In-Reply-To header (if present) — used to thread back to the lead */
	inReplyTo: string | null
	/** References header — full thread chain (oldest → newest) */
	references: string[]
	receivedAt: Date
}
