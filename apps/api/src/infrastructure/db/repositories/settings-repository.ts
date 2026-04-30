import { eq } from "drizzle-orm"
import type { Database } from "../client.ts"
import { appSettings } from "../schema.ts"
import type { SettingsRepository } from "#/domain/ports/settings-repository.ts"
import type { Setting } from "#/domain/settings/setting.ts"

export function createSettingsRepository(db: Database): SettingsRepository {
	return {
		async get(key: string): Promise<Setting | null> {
			const result = await db
				.select()
				.from(appSettings)
				.where(eq(appSettings.key, key))
				.limit(1)

			if (!result.length) return null

			return {
				key: result[0].key,
				value: result[0].value,
				category: result[0].category,
				label: result[0].label,
				description: result[0].description,
				valueType: result[0].valueType,
				updatedAt: result[0].updatedAt,
				updatedBy: result[0].updatedBy,
			}
		},

		async getByCategory(category: string): Promise<Setting[]> {
			const results = await db
				.select()
				.from(appSettings)
				.where(eq(appSettings.category, category))

			return results.map((result: any) => ({
				key: result.key,
				value: result.value,
				category: result.category,
				label: result.label,
				description: result.description,
				valueType: result.valueType,
				updatedAt: result.updatedAt,
				updatedBy: result.updatedBy,
			}))
		},

		async getAll(): Promise<Setting[]> {
			const results = await db.select().from(appSettings)

			return results.map((result: any) => ({
				key: result.key,
				value: result.value,
				category: result.category,
				label: result.label,
				description: result.description,
				valueType: result.valueType,
				updatedAt: result.updatedAt,
				updatedBy: result.updatedBy,
			}))
		},

		async set(key: string, value: any, updatedBy?: string): Promise<Setting> {
			const result = await db
				.update(appSettings)
				.set({
					value,
					updatedBy,
					updatedAt: new Date(),
				})
				.where(eq(appSettings.key, key))
				.returning()

			if (!result.length) {
				throw new Error(`Setting with key ${key} not found. Use upsert for new settings.`)
			}

			return {
				key: result[0].key,
				value: result[0].value,
				category: result[0].category,
				label: result[0].label,
				description: result[0].description,
				valueType: result[0].valueType,
				updatedAt: result[0].updatedAt,
				updatedBy: result[0].updatedBy,
			}
		},

		async setBulk(entries: Array<{ key: string; value: any }>, updatedBy?: string): Promise<void> {
			await db.transaction(async (tx: any) => {
				for (const entry of entries) {
					await tx
						.update(appSettings)
						.set({
							value: entry.value,
							updatedBy,
							updatedAt: new Date(),
						})
						.where(eq(appSettings.key, entry.key))
				}
			})
		},

		async delete(key: string): Promise<void> {
			await db.delete(appSettings).where(eq(appSettings.key, key))
		},

		async upsert(setting: Omit<Setting, "updatedAt">): Promise<Setting> {
			const result = await db
				.insert(appSettings)
				.values({
					key: setting.key,
					value: setting.value,
					category: setting.category,
					label: setting.label,
					description: setting.description,
					valueType: setting.valueType,
					updatedBy: setting.updatedBy,
				})
				.onConflictDoUpdate({
					target: appSettings.key,
					set: {
						value: setting.value,
						category: setting.category,
						label: setting.label,
						description: setting.description,
						valueType: setting.valueType,
						updatedBy: setting.updatedBy,
						updatedAt: new Date(),
					},
				})
				.returning()

			return {
				key: result[0].key,
				value: result[0].value,
				category: result[0].category,
				label: result[0].label,
				description: result[0].description,
				valueType: result[0].valueType,
				updatedAt: result[0].updatedAt,
				updatedBy: result[0].updatedBy,
			}
		},
	}
}
