import type { Cache } from "#/domain/ports/cache.ts"
import type { SettingsRepository } from "#/domain/ports/settings-repository.ts"
import type { Setting } from "#/domain/settings/setting.ts"
import { DEFAULT_SETTINGS } from "#/infrastructure/db/seed-settings.ts"

export class SettingsService {
	constructor(
		private readonly repository: SettingsRepository,
		private readonly cache: Cache,
	) {}

	private getCacheKey(key: string): string {
		return `settings:${key}`
	}

	async get<T>(key: string, defaultValue?: T): Promise<T> {
		const cacheKey = this.getCacheKey(key)

		// 1. Try Cache
		const cached = await this.cache.get<T>(cacheKey)
		if (cached !== null) {
			return cached
		}

		// 2. Try DB
		const setting = await this.repository.get(key)
		if (setting) {
			await this.cache.set(cacheKey, setting.value, 300) // 5 min TTL
			return setting.value as T
		}

		// 3. Fallback to hardcoded defaults or provided default
		const hardcoded = DEFAULT_SETTINGS.find((s) => s.key === key)
		if (hardcoded) {
			return hardcoded.value as T
		}

		if (defaultValue !== undefined) {
			return defaultValue
		}

		throw new Error(`Setting ${key} not found and no default provided`)
	}

	async set(key: string, value: any, updatedBy?: string): Promise<Setting> {
		// Verify setting exists (to avoid random keys)
		const exists = await this.repository.get(key)
		const hardcoded = DEFAULT_SETTINGS.find((s) => s.key === key)

		let setting: Setting

		if (exists) {
			setting = await this.repository.set(key, value, updatedBy)
		} else if (hardcoded) {
			// First time overriding default
			setting = await this.repository.upsert({
				key,
				value,
				category: hardcoded.category,
				label: hardcoded.label,
				description: hardcoded.description || null,
				valueType: hardcoded.valueType,
				updatedBy: updatedBy || null,
			})
		} else {
			throw new Error(`Setting key ${key} is invalid/unregistered.`)
		}

		// Invalidate cache
		await this.cache.del(this.getCacheKey(key))

		return setting
	}

	async setBulk(entries: Array<{ key: string; value: any }>, updatedBy?: string): Promise<void> {
		const validEntries = []
		
		for (const entry of entries) {
			const exists = await this.repository.get(entry.key)
			if (exists) {
				validEntries.push(entry)
			} else {
				const hardcoded = DEFAULT_SETTINGS.find((s) => s.key === entry.key)
				if (hardcoded) {
					await this.repository.upsert({
						key: entry.key,
						value: entry.value,
						category: hardcoded.category,
						label: hardcoded.label,
						description: hardcoded.description || null,
						valueType: hardcoded.valueType,
						updatedBy: updatedBy || null,
					})
				}
			}
		}

		if (validEntries.length > 0) {
			await this.repository.setBulk(validEntries, updatedBy)
		}

		// Invalidate caches
		for (const entry of entries) {
			await this.cache.del(this.getCacheKey(entry.key))
		}
	}

	async getByCategory(category: string): Promise<Setting[]> {
		// We get DB settings and merge with defaults for UI
		const dbSettings = await this.repository.getByCategory(category)
		const defaultSettings = DEFAULT_SETTINGS.filter((s) => s.category === category)

		const merged = [...dbSettings]

		for (const def of defaultSettings) {
			if (!merged.find((s) => s.key === def.key)) {
				merged.push({
					key: def.key,
					value: def.value,
					category: def.category,
					label: def.label,
					description: def.description || null,
					valueType: def.valueType,
					updatedAt: new Date(0), // Indicate it's unedited
					updatedBy: null,
				})
			}
		}

		return merged
	}

	async getAll(): Promise<Setting[]> {
		const dbSettings = await this.repository.getAll()
		const merged = [...dbSettings]

		for (const def of DEFAULT_SETTINGS) {
			if (!merged.find((s) => s.key === def.key)) {
				merged.push({
					key: def.key,
					value: def.value,
					category: def.category,
					label: def.label,
					description: def.description || null,
					valueType: def.valueType,
					updatedAt: new Date(0),
					updatedBy: null,
				})
			}
		}

		return merged
	}

	async resetToDefault(key: string): Promise<void> {
		await this.repository.delete(key)
		await this.cache.del(this.getCacheKey(key))
	}
}
