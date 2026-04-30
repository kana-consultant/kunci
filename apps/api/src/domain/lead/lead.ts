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
  messageIds: string[]
  lastEmailSentAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type LeadStage = 0 | 1 | 2 | 3

export type ReplyStatus =
  | "pending"
  | "researching"
  | "research_failed"
  | "ready"
  | "awaiting"
  | "replied"
  | "bounced"
  | "completed"

export interface CreateLeadInput {
  fullName: string
  email: string
  companyName: string
  companyWebsite: string
  painPoints?: string
  leadSource?: string
}
