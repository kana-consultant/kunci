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

	getReceivedEmail(emailId: string): Promise<{ textBody: string, subject: string, fromEmail: string, messageId: string }>
	verifyWebhook(payload: string, headers: Record<string, string>, secret: string): any
}

export interface SendEmailParams {
	to: string
	subject: string
	html: string
	leadId: string
	stage: number
}

export interface ReplyInThreadParams {
	to: string
	subject: string
	html: string
	originalMessageId: string
	previousRefs: string[]
	leadId: string
	stage: number
}

export interface EmailSendResult {
	messageId: string
	sentAt: Date
}
