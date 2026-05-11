export const MESSAGE_DIRECTIONS = ["inbound", "outbound"] as const
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number]

export const REPLY_INTENTS = [
	"interested",
	"not_interested",
	"unsubscribe",
	"objection",
	"question",
	"neutral",
] as const
export type ReplyIntent = (typeof REPLY_INTENTS)[number]

export function isReplyIntent(s: unknown): s is ReplyIntent {
	return REPLY_INTENTS.includes(s as ReplyIntent)
}

export interface EmailMessage {
	id: string
	leadId: string
	direction: MessageDirection
	subject: string
	textBody: string
	htmlBody: string | null
	messageId: string | null
	inReplyTo: string | null
	intent: ReplyIntent | null
	createdAt: Date
}

export interface CreateEmailMessageInput {
	leadId: string
	direction: MessageDirection
	subject: string
	textBody: string
	htmlBody?: string | null
	messageId?: string | null
	inReplyTo?: string | null
	intent?: ReplyIntent | null
}
