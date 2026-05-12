import { Cron } from "croner"
import type { UseCases } from "#/application/use-cases.ts"
import { SETTING_KEYS } from "#/domain/settings/setting-keys.ts"
import { logger } from "#/infrastructure/observability/logger.ts"

const DEFAULT_CRON_EXPRESSION = "30 9 * * *"
const DEFAULT_CRON_TIMEZONE = "UTC"

export async function startScheduler(useCases: UseCases): Promise<Cron | null> {
	const enabled = await getSetting<boolean | string>(
		useCases,
		SETTING_KEYS.SCHEDULER_ENABLED,
		true,
	)

	if (!isEnabled(enabled)) {
		logger.info("Background scheduler disabled")
		return null
	}

	const cronExpression = String(
		await getSetting<string>(
			useCases,
			SETTING_KEYS.SCHEDULER_CRON_EXPRESSION,
			DEFAULT_CRON_EXPRESSION,
		),
	).trim()
	const timezone = String(
		await getSetting<string>(
			useCases,
			SETTING_KEYS.SCHEDULER_CRON_TIMEZONE,
			DEFAULT_CRON_TIMEZONE,
		),
	).trim()

	const runFollowupProcessor = async () => {
		logger.info("[CRON] Running daily follow-up processor")
		try {
			await useCases.scheduler.processPendingFollowups()
		} catch (error) {
			logger.error({ error }, "[CRON] Failed to process follow-ups")
		}
	}

	try {
		const scheduler = new Cron(
			cronExpression || DEFAULT_CRON_EXPRESSION,
			{ timezone: timezone || DEFAULT_CRON_TIMEZONE },
			runFollowupProcessor,
		)
		logger.info(
			{ cronExpression, timezone },
			"Started background follow-up scheduler",
		)
		return scheduler
	} catch (error) {
		logger.error(
			{ error, cronExpression, timezone },
			"Invalid scheduler settings, falling back to defaults",
		)
		return new Cron(
			DEFAULT_CRON_EXPRESSION,
			{ timezone: DEFAULT_CRON_TIMEZONE },
			runFollowupProcessor,
		)
	}
}

async function getSetting<T>(
	useCases: UseCases,
	key: string,
	defaultValue: T,
): Promise<T> {
	try {
		return await useCases.settings.get<T>(key, defaultValue)
	} catch (error) {
		logger.warn({ error, key }, "Failed to load scheduler setting")
		return defaultValue
	}
}

function isEnabled(value: boolean | string): boolean {
	if (typeof value === "boolean") return value
	return !["false", "0", "off", "disabled"].includes(value.toLowerCase())
}
