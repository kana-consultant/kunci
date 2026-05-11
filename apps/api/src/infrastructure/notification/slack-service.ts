import type {
	NotificationEvent,
	NotificationService,
} from "#/domain/ports/notification-service.ts"

function buildText(event: NotificationEvent): string {
	switch (event.type) {
		case "lead.email_invalid":
			return `*Email Invalid* — \`${event.email}\`\nReason: ${event.reason}`
		case "pipeline.failed":
			return `*Pipeline Failed* — lead \`${event.leadId}\`\nError: ${event.error}`
		case "lead.completed": {
			const notes = event.notes ? `\nNotes: ${event.notes}` : ""
			return `*Lead Conversation Closed* — \`${event.leadId}\`\nReason: ${event.reason}\nIntent: ${event.intent} (${event.confidence.toFixed(2)})${notes}`
		}
	}
}

export function createSlackNotificationService(
	webhookUrl: string,
): NotificationService {
	return {
		async send(event: NotificationEvent): Promise<void> {
			const body = JSON.stringify({ text: buildText(event) })
			const res = await fetch(webhookUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body,
			})
			if (!res.ok) {
				throw new Error(`Slack webhook failed: ${res.status}`)
			}
		},
	}
}
