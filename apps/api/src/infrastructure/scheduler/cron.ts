import { Cron } from "croner"
import type { UseCases } from "#/application/use-cases.ts"
import { logger } from "#/infrastructure/observability/logger.ts"

export function startScheduler(useCases: UseCases) {
	logger.info("Starting background scheduler")

	// Daily at 9:30 AM — Process pending follow-ups
	new Cron("30 9 * * *", { timezone: "UTC" }, async () => {
		logger.info("[CRON] Running daily follow-up processor")
		try {
			await useCases.scheduler.processPendingFollowups()
		} catch (error) {
			logger.error({ error }, "[CRON] Failed to process follow-ups")
		}
	})
}
