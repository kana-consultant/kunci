/**
 * Port for email sending operations.
 * Implementation: infrastructure/email/resend-service.ts
 * Provider: Resend SDK
 */
export interface EmailService {
	/** Send a new email (not in a thread) */
	send(params: SendEmailParams): Promise<EmailSendResult>

	/** Reply in an existing email thread */
	replyInThread(params: ReplyInThreadParams): Promise<EmailSendResult>

	getReceivedEmail(emailId: string): Promise<{
		textBody: string
		subject: string
		fromEmail: string
		messageId: string
	}>
	verifyWebhook(
		payload: string,
		headers: Record<string, string | string[]>,
		secret: string,
	): unknown
}

export interface EmailAttachment {
	filename: string
	/** Raw bytes — the email adapter converts to whatever the provider expects. */
	content: Buffer
	contentType?: string
}

export interface SendEmailParams {
	to: string
	subject: string
	html: string
	leadId: string
	stage: number
	/** RFC 8058 one-click unsubscribe URL. If set, List-Unsubscribe headers are added. */
	unsubscribeUrl?: string
	attachments?: EmailAttachment[]
}

export interface ReplyInThreadParams {
	to: string
	subject: string
	html: string
	originalMessageId: string
	previousRefs: string[]
	leadId: string
	stage: number
	unsubscribeUrl?: string
}

export interface EmailSendResult {
	messageId: string
	sentAt: Date
}
