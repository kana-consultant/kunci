import type { CreateLeadInput, Lead, LeadStage, ReplyStatus } from "./lead.ts"

export interface LeadRepository {
	create(input: CreateLeadInput): Promise<Lead>
	findById(id: string): Promise<Lead | null>
	findByEmail(email: string): Promise<Lead | null>
	list(params: ListLeadsParams): Promise<{ leads: Lead[]; total: number }>
	update(id: string, data: Partial<UpdateLeadData>): Promise<Lead>
	findPendingFollowups(params: PendingFollowupsParams): Promise<Lead[]>
	getStats(): Promise<{
		total: number
		sent: number
		replied: number
		bounced: number
	}>
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
}

export interface PendingFollowupsParams {
	replyStatus: ReplyStatus
	maxStage: number
	lastEmailBefore: Date
}
