export interface Lead {
	id: string
	fullName: string
	email: string
	companyName: string
	companyWebsite: string
	painPoints: string | null
	leadSource: string | null
	companyResearch: string | null
	stage: LeadStage
	replyStatus: ReplyStatus
	latestMessageId: string | null
	linkedinUrl: string | null
	messageIds: string[]
	lastEmailSentAt: Date | null
	createdAt: Date
	updatedAt: Date
}

export type LeadStage = 0 | 1 | 2 | 3

export const REPLY_STATUSES = [
	"pending",
	"researching",
	"research_failed",
	"ready",
	"awaiting",
	"replied",
	"bounced",
	"completed",
] as const

export type ReplyStatus = (typeof REPLY_STATUSES)[number]

export function isReplyStatus(s: unknown): s is ReplyStatus {
	return REPLY_STATUSES.includes(s as ReplyStatus)
}

export interface CreateLeadInput {
	fullName: string
	email: string
	companyName: string
	companyWebsite: string
	painPoints?: string
	leadSource?: string
	linkedinUrl?: string
}
