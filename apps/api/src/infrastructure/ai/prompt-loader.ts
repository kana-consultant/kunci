import type { SettingsService } from "#/application/shared/settings-service.ts"
import { SETTING_KEYS } from "#/domain/settings/setting-keys.ts"
import * as StaticPrompts from "./prompts/index.ts"

export class PromptLoader {
	constructor(private readonly settings: SettingsService) {}

	async getPrompt(key: string, fallback: string): Promise<string> {
		try {
			return await this.settings.get<string>(key, fallback)
		} catch {
			return fallback
		}
	}

	async getBehaviorAnalyzerPrompt(): Promise<string> {
		return this.getPrompt(
			SETTING_KEYS.AI_PROMPT_BEHAVIOR_ANALYZER,
			StaticPrompts.BEHAVIOR_ANALYZER_PROMPT,
		)
	}

	async getSequenceGeneratorPrompt(): Promise<string> {
		return this.getPrompt(
			SETTING_KEYS.AI_PROMPT_SEQUENCE_GENERATOR,
			StaticPrompts.SEQUENCE_GENERATOR_PROMPT,
		)
	}

	async getWebsiteAnalyzerPrompt(): Promise<string> {
		return this.getPrompt(
			SETTING_KEYS.AI_PROMPT_WEBSITE_ANALYZER,
			StaticPrompts.WEBSITE_ANALYZER_PROMPT,
		)
	}

	async getCompanyProfilerPrompt(): Promise<string> {
		return this.getPrompt(
			SETTING_KEYS.AI_PROMPT_COMPANY_PROFILER,
			StaticPrompts.COMPANY_PROFILER_PROMPT,
		)
	}

	async getEmailHtmlConverterPrompt(): Promise<string> {
		return this.getPrompt(
			SETTING_KEYS.AI_PROMPT_HTML_CONVERTER,
			StaticPrompts.EMAIL_HTML_CONVERTER_PROMPT,
		)
	}

	async getReplyPersonalizerPrompt(): Promise<string> {
		return this.getPrompt(
			SETTING_KEYS.AI_PROMPT_REPLY_PERSONALIZER,
			StaticPrompts.REPLY_PERSONALIZER_PROMPT,
		)
	}

	async getSubjectLinePickerPrompt(): Promise<string> {
		return this.getPrompt(
			SETTING_KEYS.AI_PROMPT_SUBJECT_LINE_PICKER,
			StaticPrompts.SUBJECT_LINE_PICKER_PROMPT,
		)
	}
}
