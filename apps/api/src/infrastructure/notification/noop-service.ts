import type {
	NotificationEvent,
	NotificationService,
} from "#/domain/ports/notification-service.ts"

export function createNoopNotificationService(): NotificationService {
	return {
		async send(_event: NotificationEvent): Promise<void> {
			// intentionally empty
		},
	}
}
