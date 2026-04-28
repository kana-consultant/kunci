import type { CreateEmailSequenceInput, EmailSequence } from "./email-sequence.ts"

export interface EmailSequenceRepository {
	saveAll(leadId: string, sequences: CreateEmailSequenceInput[]): Promise<EmailSequence[]>
	findByLeadId(leadId: string): Promise<EmailSequence[]>
	getByStage(leadId: string, emailNumber: 1 | 2 | 3): Promise<EmailSequence | null>
	updateHtml(id: string, htmlContent: string): Promise<void>
	markSent(id: string): Promise<void>
}
