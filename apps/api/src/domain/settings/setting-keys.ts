export const SETTING_KEYS = {
	// AI: Models
	AI_MODEL_BEHAVIOR_ANALYZER: "ai.model.behavior_analyzer",
	AI_MODEL_WEBSITE_ANALYZER: "ai.model.website_analyzer",
	AI_MODEL_COMPANY_PROFILER: "ai.model.company_profiler",
	AI_MODEL_EMAIL_GENERATOR: "ai.model.email_generator",
	AI_MODEL_HTML_CONVERTER: "ai.model.html_converter",
	AI_MODEL_REPLY_PERSONALIZER: "ai.model.reply_personalizer",
	AI_MODEL_SUBJECT_LINE_PICKER: "ai.model.subject_line_picker",

	// AI: Temperature
	AI_TEMPERATURE_DEFAULT: "ai.temperature.default",
	AI_TEMPERATURE_COMPANY_PROFILER: "ai.temperature.company_profiler",
	AI_TEMPERATURE_HTML_CONVERTER: "ai.temperature.html_converter",

	// AI: Prompts
	AI_PROMPT_BEHAVIOR_ANALYZER: "ai.prompt.behavior_analyzer",
	AI_PROMPT_SEQUENCE_GENERATOR: "ai.prompt.sequence_generator",
	AI_PROMPT_WEBSITE_ANALYZER: "ai.prompt.website_analyzer",
	AI_PROMPT_COMPANY_PROFILER: "ai.prompt.company_profiler",
	AI_PROMPT_HTML_CONVERTER: "ai.prompt.html_converter",
	AI_PROMPT_REPLY_PERSONALIZER: "ai.prompt.reply_personalizer",
	AI_PROMPT_SUBJECT_LINE_PICKER: "ai.prompt.subject_line_picker",

	// AI: Limits & Retries
	AI_LIMIT_WEBSITE_MARKDOWN_CHARS: "ai.limit.website_markdown_chars",
	AI_LIMIT_COMPANY_CONTENT_CHARS: "ai.limit.company_content_chars",
	AI_LIMIT_SCRAPER_FALLBACK_CHARS: "ai.limit.scraper_fallback_chars",
	AI_RETRY_MAX_RETRIES: "ai.retry.max_retries",

	// Email
	EMAIL_SENDER_NAME: "email.sender_name",
	EMAIL_SENDER_COMPANY: "email.sender_company",
	EMAIL_SENDER_EMAIL: "email.sender_email",

	// Business Profile
	BUSINESS_NAME: "business.name",
	BUSINESS_DESCRIPTION: "business.description",
	BUSINESS_INDUSTRY: "business.industry",
	BUSINESS_VALUE_PROPOSITION: "business.value_proposition",
	BUSINESS_TARGET_MARKET: "business.target_market",
	BUSINESS_TONE_OF_VOICE: "business.tone_of_voice",
	BUSINESS_WEBSITE: "business.website",
	BUSINESS_OFFERINGS: "business.offerings",

	EMAIL_COLOR_PRIMARY: "email.color_primary",
	EMAIL_COLOR_ACCENT: "email.color_accent",
	EMAIL_COLOR_CTA: "email.color_cta",
	EMAIL_COLOR_TEXT: "email.color_text",
	EMAIL_COLOR_BACKGROUND: "email.color_background",
	EMAIL_FONT_FAMILY: "email.font_family",

	// Pipeline
	PIPELINE_EMAIL_SEQUENCE_COUNT: "pipeline.email_sequence_count",
	PIPELINE_BULK_IMPORT_MAX: "pipeline.bulk_import_max",

	// Scheduler
	SCHEDULER_CRON_EXPRESSION: "scheduler.cron_expression",
	SCHEDULER_CRON_TIMEZONE: "scheduler.cron_timezone",
	SCHEDULER_FOLLOWUP_DELAY_DAYS: "scheduler.followup_delay_days",
	SCHEDULER_ENABLED: "scheduler.enabled",
} as const

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS]
