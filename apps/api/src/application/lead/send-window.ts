import type { SettingsService } from "#/application/shared/settings-service.ts"
import { SETTING_KEYS } from "#/domain/settings/setting-keys.ts"

export interface SendWindowOptions {
	enabled: boolean
	startHour: number
	endHour: number
	skipWeekends: boolean
	defaultTimezone: string
}

export async function loadSendWindowOptions(
	settings: SettingsService,
): Promise<SendWindowOptions> {
	const [enabled, startHour, endHour, skipWeekends, defaultTimezone] =
		await Promise.all([
			settings.get<boolean>(SETTING_KEYS.SCHEDULER_SEND_WINDOW_ENABLED, true),
			settings.get<number>(SETTING_KEYS.SCHEDULER_SEND_WINDOW_START_HOUR, 9),
			settings.get<number>(SETTING_KEYS.SCHEDULER_SEND_WINDOW_END_HOUR, 17),
			settings.get<boolean>(
				SETTING_KEYS.SCHEDULER_SEND_WINDOW_SKIP_WEEKENDS,
				true,
			),
			settings.get<string>(
				SETTING_KEYS.SCHEDULER_SEND_WINDOW_DEFAULT_TIMEZONE,
				"Asia/Jakarta",
			),
		])
	return {
		enabled: Boolean(enabled),
		startHour: clampHour(Number(startHour), 9),
		endHour: clampHour(Number(endHour), 17),
		skipWeekends: Boolean(skipWeekends),
		defaultTimezone,
	}
}

/**
 * Return how many milliseconds to delay an enqueue so the job pops inside the
 * recipient's local business hours. Returns 0 when "now" is already in window
 * or when the window feature is disabled.
 */
export function computeSendDelayMs(
	timezone: string | null,
	options: SendWindowOptions,
	now: Date = new Date(),
): number {
	if (!options.enabled) return 0
	const tz = timezone ?? options.defaultTimezone
	const parts = getLocalParts(now, tz)
	if (!parts) return 0

	const inWindow =
		parts.hour >= options.startHour && parts.hour < options.endHour
	const isWeekend = parts.weekday === 0 || parts.weekday === 6
	if (inWindow && !(options.skipWeekends && isWeekend)) return 0

	// Walk forward in 30-min steps until we hit a valid window. Hard cap at
	// 96 steps (= 48h) so we never spin forever on a misconfigured timezone.
	const STEP_MS = 30 * 60 * 1000
	for (let i = 1; i <= 96; i++) {
		const candidate = new Date(now.getTime() + i * STEP_MS)
		const cParts = getLocalParts(candidate, tz)
		if (!cParts) continue
		const cIsWeekend = cParts.weekday === 0 || cParts.weekday === 6
		if (options.skipWeekends && cIsWeekend) continue
		if (cParts.hour >= options.startHour && cParts.hour < options.endHour) {
			return candidate.getTime() - now.getTime()
		}
	}
	return 0
}

interface LocalParts {
	hour: number
	/** 0 = Sunday, 6 = Saturday */
	weekday: number
}

function getLocalParts(date: Date, timezone: string): LocalParts | null {
	try {
		const fmt = new Intl.DateTimeFormat("en-US", {
			timeZone: timezone,
			hour: "numeric",
			hour12: false,
			weekday: "short",
		})
		const parts = fmt.formatToParts(date)
		const hourStr = parts.find((p) => p.type === "hour")?.value
		const weekdayStr = parts.find((p) => p.type === "weekday")?.value
		if (!hourStr || !weekdayStr) return null
		return {
			hour: Number(hourStr) % 24,
			weekday: weekdayMap[weekdayStr] ?? 0,
		}
	} catch {
		return null
	}
}

const weekdayMap: Record<string, number> = {
	Sun: 0,
	Mon: 1,
	Tue: 2,
	Wed: 3,
	Thu: 4,
	Fri: 5,
	Sat: 6,
}

function clampHour(value: number, fallback: number): number {
	if (!Number.isFinite(value)) return fallback
	if (value < 0) return 0
	if (value > 23) return 23
	return Math.floor(value)
}
