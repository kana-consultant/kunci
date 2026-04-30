import type { Setting } from "../settings/setting.ts"

export interface SettingsRepository {
	get(key: string): Promise<Setting | null>
	getByCategory(category: string): Promise<Setting[]>
	getAll(): Promise<Setting[]>
	set(key: string, value: any, updatedBy?: string): Promise<Setting>
	setBulk(entries: Array<{ key: string; value: any }>, updatedBy?: string): Promise<void>
	delete(key: string): Promise<void>
	upsert(setting: Omit<Setting, "updatedAt">): Promise<Setting>
}
