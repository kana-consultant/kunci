import type { Lead } from "#/domain/lead/lead.ts"
import type { LeadRepository } from "#/domain/lead/lead-repository.ts"
import type { Logger } from "#/domain/ports/logger.ts"
import { SETTING_KEYS } from "#/domain/settings/setting-keys.ts"

const DEFAULT_FOLLOWUP_DELAY_DAYS = 4
const DAY_MS = 24 * 60 * 60 * 1000

interface SettingsReader {
	get<T>(key: string, defaultValue?: T): Promise<T>
}

interface SchedulerDeps {
	leadRepo: LeadRepository
	sendFollowup: (lead: Lead) => Promise<void>
	settings: SettingsReader
	logger: Logger
}

export function makeProcessPendingFollowupsUseCase(deps: SchedulerDeps) {
	return async (): Promise<{ processed: number; errors: number }> => {
		const delayDays = await getFollowupDelayDays(deps.settings)
		const lastEmailBefore = new Date(Date.now() - delayDays * DAY_MS)

		const leads = await deps.leadRepo.findPendingFollowups({
			replyStatus: "awaiting",
			maxStage: 2,
			lastEmailBefore,
		})

		deps.logger.info(
			{ count: leads.length, delayDays },
			"Processing pending follow-ups",
		)

		let processed = 0
		let errors = 0

		for (const lead of leads) {
			try {
				await deps.sendFollowup(lead)
				processed++
			} catch (error) {
				errors++
				deps.logger.error(
					{ leadId: lead.id, error },
					"Follow-up processing failed",
				)
			}
		}

		deps.logger.info({ processed, errors }, "Follow-up processing complete")
		return { processed, errors }
	}
}

async function getFollowupDelayDays(settings: SettingsReader): Promise<number> {
	const configuredDelayDays = await settings.get<number | string>(
		SETTING_KEYS.SCHEDULER_FOLLOWUP_DELAY_DAYS,
		DEFAULT_FOLLOWUP_DELAY_DAYS,
	)
	const delayDays = Number(configuredDelayDays)

	if (!Number.isFinite(delayDays) || delayDays < 0) {
		return DEFAULT_FOLLOWUP_DELAY_DAYS
	}

	return delayDays
}
