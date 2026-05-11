export type NotificationEvent =
	| { type: "lead.email_invalid"; email: string; reason: string }
	| { type: "pipeline.failed"; leadId: string; error: string }

export interface NotificationService {
	send(event: NotificationEvent): Promise<void>
}
