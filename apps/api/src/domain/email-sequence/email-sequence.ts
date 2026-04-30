export interface EmailSequence {
	id: string
	leadId: string
	emailNumber: 1 | 2 | 3
	subjectLines: string[]
	content: string
	htmlContent: string | null
	cta: string
	psychologicalTrigger: string
	sentAt: Date | null
	createdAt: Date
}

export interface CreateEmailSequenceInput {
	leadId: string
	emailNumber: 1 | 2 | 3
	subjectLines: string[]
	content: string
	cta: string
	psychologicalTrigger: string
}
