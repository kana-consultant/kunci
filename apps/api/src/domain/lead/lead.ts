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
	autoReplyTurns: number
	completedReason: CompletedReason | null
	createdAt: Date
	updatedAt: Date
}

export const COMPLETED_REASONS = [
	"won",
	"opted_out",
	"not_interested",
	"cap_reached",
] as const

export type CompletedReason = (typeof COMPLETED_REASONS)[number]

export function isCompletedReason(s: unknown): s is CompletedReason {
	return COMPLETED_REASONS.includes(s as CompletedReason)
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
