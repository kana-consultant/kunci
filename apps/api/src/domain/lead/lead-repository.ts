import type {
	CompletedReason,
	CreateLeadInput,
	Lead,
	LeadStage,
	ReplyStatus,
} from "./lead.ts"

export interface LeadRepository {
	create(input: CreateLeadInput): Promise<Lead>
	findById(id: string): Promise<Lead | null>
	findByEmail(email: string): Promise<Lead | null>
	list(params: ListLeadsParams): Promise<{ leads: Lead[]; total: number }>
	update(id: string, data: Partial<UpdateLeadData>): Promise<Lead>
	findPendingFollowups(params: PendingFollowupsParams): Promise<Lead[]>
	getStats(period?: "7d" | "30d" | "all"): Promise<{
		total: number
		sent: number
		replied: number
		bounced: number
		pending: number
		researching: number
		researchFailed: number
		awaiting: number
	}>
	getStageDistribution(
		period?: "7d" | "30d" | "all",
	): Promise<Array<{ stage: number; count: number }>>
}

export interface ListLeadsParams {
	page: number
	limit: number
	stage?: LeadStage
	status?: ReplyStatus
}

export interface UpdateLeadData {
	stage: LeadStage
	replyStatus: ReplyStatus
	companyResearch: string
	latestMessageId: string
	messageIds: string[]
	lastEmailSentAt: Date
	linkedinUrl: string
	autoReplyTurns: number
	completedReason: CompletedReason | null
	country: string | null
	locale: string | null
	language: string | null
	timezone: string | null
	companyIndustry: string | null
	companySize: string | null
	enrichedAt: Date
}

export interface PendingFollowupsParams {
	replyStatus: ReplyStatus
	maxStage: number
	lastEmailBefore: Date
}
