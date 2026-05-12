import { randomUUID } from "node:crypto"
import { extname } from "node:path"
import { AppError } from "#/application/shared/errors.ts"
import type { SettingsService } from "#/application/shared/settings-service.ts"
import type { FileStorage } from "#/domain/ports/file-storage.ts"
import type { Logger } from "#/domain/ports/logger.ts"
import { SETTING_KEYS } from "#/domain/settings/setting-keys.ts"

export interface CompanyProfileFileMeta {
	storageKey: string
	fileName: string
	mime: string
	size: number
	uploadedAt: string
}

export type CompanyProfileMode = "disabled" | "url" | "file"

const ALLOWED_MIME: Record<string, string> = {
	"application/pdf": ".pdf",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document":
		".docx",
	"application/msword": ".doc",
}

interface Deps {
	storage: FileStorage
	settings: SettingsService
	maxBytes: number
	logger: Logger
}

export function makeUploadCompanyProfileUseCase(deps: Deps) {
	return async (input: {
		bytes: Buffer
		mime: string
		fileName: string
		updatedBy?: string
	}): Promise<CompanyProfileFileMeta> => {
		const ext = ALLOWED_MIME[input.mime]
		if (!ext) {
			throw new AppError(
				"BAD_REQUEST",
				`Unsupported file type: ${input.mime}. Allowed: PDF, DOCX, DOC.`,
			)
		}
		if (input.bytes.length === 0) {
			throw new AppError("BAD_REQUEST", "Empty file")
		}
		if (input.bytes.length > deps.maxBytes) {
			throw new AppError(
				"BAD_REQUEST",
				`File exceeds max size of ${deps.maxBytes} bytes`,
			)
		}

		// Drop the previous file (if any) before writing the new one so disk
		// doesn't accumulate orphaned blobs.
		const previous = await deps.settings.get<CompanyProfileFileMeta | null>(
			SETTING_KEYS.BUSINESS_COMPANY_PROFILE_FILE,
			null,
		)
		if (previous?.storageKey) {
			await deps.storage.delete(previous.storageKey).catch((err) => {
				deps.logger.warn(
					{ err, storageKey: previous.storageKey },
					"Failed to delete previous company profile file",
				)
			})
		}

		const inferredExt = ext || extname(input.fileName).toLowerCase()
		const storageKey = `company-profile/${randomUUID()}${inferredExt}`
		await deps.storage.put({
			key: storageKey,
			bytes: input.bytes,
			mime: input.mime,
		})

		const meta: CompanyProfileFileMeta = {
			storageKey,
			fileName: input.fileName,
			mime: input.mime,
			size: input.bytes.length,
			uploadedAt: new Date().toISOString(),
		}
		await deps.settings.set(
			SETTING_KEYS.BUSINESS_COMPANY_PROFILE_FILE,
			meta,
			input.updatedBy,
		)

		// If the user uploads a file while mode is disabled, auto-flip to
		// "file" — it's almost always what they meant. They can still revert
		// the mode in the settings UI.
		const currentMode = await deps.settings.get<CompanyProfileMode>(
			SETTING_KEYS.BUSINESS_COMPANY_PROFILE_MODE,
			"disabled",
		)
		if (currentMode === "disabled") {
			await deps.settings.set(
				SETTING_KEYS.BUSINESS_COMPANY_PROFILE_MODE,
				"file",
				input.updatedBy,
			)
		}

		return meta
	}
}

export function makeClearCompanyProfileFileUseCase(deps: Deps) {
	return async (_updatedBy?: string): Promise<void> => {
		const previous = await deps.settings.get<CompanyProfileFileMeta | null>(
			SETTING_KEYS.BUSINESS_COMPANY_PROFILE_FILE,
			null,
		)
		if (previous?.storageKey) {
			await deps.storage.delete(previous.storageKey).catch((err) => {
				deps.logger.warn(
					{ err, storageKey: previous.storageKey },
					"Failed to delete company profile file from storage",
				)
			})
		}
		// app_settings.value is NOT NULL. Deleting the row falls back to the
		// hardcoded null default in DEFAULT_SETTINGS, which is the intent.
		await deps.settings.resetToDefault(
			SETTING_KEYS.BUSINESS_COMPANY_PROFILE_FILE,
		)
	}
}
