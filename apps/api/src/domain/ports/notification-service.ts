export type NotificationEvent =
	| { type: "lead.email_invalid"; email: string; reason: string }
	| { type: "pipeline.failed"; leadId: string; error: string }
	| {
			type: "lead.completed"
			leadId: string
			reason: string
			intent: string
			confidence: number
			notes?: string
	  }

export interface NotificationService {
	send(event: NotificationEvent): Promise<void>
}
