/**
 * Resend Email Service
 * Implements EmailService port using Resend SDK
 */

import { Resend } from "resend"
import type {
	EmailAttachment,
	EmailSendResult,
	EmailService,
	ReplyInThreadParams,
	SendEmailParams,
} from "#/domain/ports/email-service.ts"
import { SETTING_KEYS } from "#/domain/settings/setting-keys.ts"
import { logger } from "#/infrastructure/observability/logger.ts"

interface SettingsReader {
	get<T>(key: string, defaultValue?: T): Promise<T>
}

interface ResendConfig {
	apiKey: string
	senderEmail: string
	senderName: string
	settings?: SettingsReader
}

export function createResendService(config: ResendConfig): EmailService {
	const resend = new Resend(config.apiKey)

	return {
		async send(params: SendEmailParams): Promise<EmailSendResult> {
			let lastError: any
			const from = await getSender(config)

			for (let attempt = 1; attempt <= 3; attempt++) {
				try {
					const { data, error } = await resend.emails.send(
						{
							from,
							to: [params.to],
							subject: params.subject,
							html: params.html,
							headers: buildUnsubscribeHeaders(params.unsubscribeUrl),
							attachments: toResendAttachments(params.attachments),
							tags: [
								{ name: "lead_id", value: params.leadId },
								{ name: "stage", value: String(params.stage) },
								{ name: "type", value: "outbound" },
							],
						},
						{
							idempotencyKey: `outbound-${params.leadId}-stage-${params.stage}`,
						},
					)

					if (error) {
						lastError = error
						logger.warn(
							{ error, attempt, to: params.to },
							"Resend send attempt failed",
						)
						if (attempt < 3)
							await new Promise((resolve) =>
								setTimeout(resolve, 2000 * attempt),
							)
						continue
					}

					logger.info(
						{
							messageId: data!.id,
							to: params.to,
							stage: params.stage,
							attempt,
						},
						"Email sent",
					)

					return {
						messageId: data!.id,
						sentAt: new Date(),
					}
				} catch (err) {
					lastError = err
					logger.warn(
						{ err, attempt, to: params.to },
						"Resend send threw an exception",
					)
					if (attempt < 3)
						await new Promise((resolve) => setTimeout(resolve, 2000 * attempt))
				}
			}

			logger.error(
				{ error: lastError, to: params.to },
				"Resend send failed after 3 attempts",
			)
			throw new Error(`Resend error: ${lastError?.message || "Unknown error"}`)
		},

		async replyInThread(params: ReplyInThreadParams): Promise<EmailSendResult> {
			const subject = params.subject.startsWith("Re:")
				? params.subject
				: `Re: ${params.subject}`

			let lastError: any
			const from = await getSender(config)

			for (let attempt = 1; attempt <= 3; attempt++) {
				try {
					const { data, error } = await resend.emails.send(
						{
							from,
							to: [params.to],
							subject,
							html: params.html,
							headers: {
								"In-Reply-To": params.originalMessageId,
								References: [
									...params.previousRefs,
									params.originalMessageId,
								].join(" "),
								...buildUnsubscribeHeaders(params.unsubscribeUrl),
							},
							tags: [
								{ name: "lead_id", value: params.leadId },
								{ name: "stage", value: String(params.stage) },
								{ name: "type", value: "follow_up" },
							],
						},
						{
							idempotencyKey: `reply-${params.leadId}-stage-${params.stage}`,
						},
					)

					if (error) {
						lastError = error
						logger.warn(
							{ error, attempt, to: params.to },
							"Resend reply attempt failed",
						)
						if (attempt < 3)
							await new Promise((resolve) =>
								setTimeout(resolve, 2000 * attempt),
							)
						continue
					}

					logger.info(
						{
							messageId: data!.id,
							to: params.to,
							stage: params.stage,
							attempt,
						},
						"Reply sent in thread",
					)

					return {
						messageId: data!.id,
						sentAt: new Date(),
					}
				} catch (err) {
					lastError = err
					logger.warn(
						{ err, attempt, to: params.to },
						"Resend reply threw an exception",
					)
					if (attempt < 3)
						await new Promise((resolve) => setTimeout(resolve, 2000 * attempt))
				}
			}

			logger.error(
				{ error: lastError, to: params.to },
				"Resend reply failed after 3 attempts",
			)
			throw new Error(
				`Resend reply error: ${lastError?.message || "Unknown error"}`,
			)
		},

		async getReceivedEmail(emailId: string) {
			const { data, error } = await resend.emails.receiving.get(emailId)
			if (error || !data)
				throw new Error(`Failed to get inbound email: ${error?.message}`)

			return {
				textBody: data.text || data.html || "No content",
				subject: data.subject || "No subject",
				fromEmail: data.from,
				messageId: data.message_id || "",
			}
		},

		verifyWebhook(
			payload: string,
			headers: Record<string, string | string[] | undefined>,
			secret: string,
		): unknown {
			return resend.webhooks.verify({
				payload,
				headers: headers as any,
				webhookSecret: secret,
			})
		},
	}
}

function buildUnsubscribeHeaders(
	unsubscribeUrl: string | undefined,
): Record<string, string> | undefined {
	if (!unsubscribeUrl) return undefined
	return {
		"List-Unsubscribe": `<${unsubscribeUrl}>`,
		"List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
	}
}

function toResendAttachments(attachments: EmailAttachment[] | undefined) {
	if (!attachments?.length) return undefined
	return attachments.map((a) => ({
		filename: a.filename,
		content: a.content,
		contentType: a.contentType,
	}))
}

async function getSender(config: ResendConfig): Promise<string> {
	const configuredName = await config.settings?.get<string>(
		SETTING_KEYS.EMAIL_SENDER_NAME,
		config.senderName,
	)
	const configuredEmail = await config.settings?.get<string>(
		SETTING_KEYS.EMAIL_SENDER_EMAIL,
		config.senderEmail,
	)

	const senderName = configuredName?.trim() || config.senderName
	const senderEmail = configuredEmail?.trim() || config.senderEmail

	return `${senderName} <${senderEmail}>`
}
