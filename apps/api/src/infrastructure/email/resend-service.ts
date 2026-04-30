/**
 * Resend Email Service
 * Implements EmailService port using Resend SDK
 */

import { Resend } from "resend"
import type {
	EmailSendResult,
	EmailService,
	ReplyInThreadParams,
	SendEmailParams,
} from "#/domain/ports/email-service.ts"
import { logger } from "#/infrastructure/observability/logger.ts"

interface ResendConfig {
	apiKey: string
	senderEmail: string
	senderName: string
}

export function createResendService(config: ResendConfig): EmailService {
	const resend = new Resend(config.apiKey)
	const from = `${config.senderName} <${config.senderEmail}>`

	return {
		async send(params: SendEmailParams): Promise<EmailSendResult> {
			const { data, error } = await resend.emails.send(
				{
					from,
					to: [params.to],
					subject: params.subject,
					html: params.html,
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
				logger.error({ error, to: params.to }, "Resend send failed")
				throw new Error(`Resend error: ${error.message}`)
			}

			logger.info(
				{ messageId: data!.id, to: params.to, stage: params.stage },
				"Email sent",
			)

			return {
				messageId: data!.id,
				sentAt: new Date(),
			}
		},

		async replyInThread(params: ReplyInThreadParams): Promise<EmailSendResult> {
			const subject = params.subject.startsWith("Re:")
				? params.subject
				: `Re: ${params.subject}`

			const { data, error } = await resend.emails.send(
				{
					from,
					to: [params.to],
					subject,
					html: params.html,
					headers: {
						"In-Reply-To": params.originalMessageId,
						References: [...params.previousRefs, params.originalMessageId].join(
							" ",
						),
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
				logger.error({ error, to: params.to }, "Resend reply failed")
				throw new Error(`Resend reply error: ${error.message}`)
			}

			logger.info(
				{ messageId: data!.id, to: params.to, stage: params.stage },
				"Reply sent in thread",
			)

			return {
				messageId: data!.id,
				sentAt: new Date(),
			}
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
