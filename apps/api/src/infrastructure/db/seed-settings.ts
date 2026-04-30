import { SETTING_KEYS } from "../../domain/settings/setting-keys.ts"
import { BEHAVIOR_ANALYZER_PROMPT, COMPANY_PROFILER_PROMPT, EMAIL_HTML_CONVERTER_PROMPT, REPLY_PERSONALIZER_PROMPT, SEQUENCE_GENERATOR_PROMPT, SUBJECT_LINE_PICKER_PROMPT, WEBSITE_ANALYZER_PROMPT } from "../ai/prompts/index.ts"

export const DEFAULT_SETTINGS = [
	// ── AI: Models ──
	{ key: SETTING_KEYS.AI_MODEL_BEHAVIOR_ANALYZER, value: "openai/gpt-4o", category: "ai", label: "Behavior Analyzer Model", valueType: "string" },
	{ key: SETTING_KEYS.AI_MODEL_WEBSITE_ANALYZER, value: "openai/o3-mini", category: "ai", label: "Website Analyzer Model", valueType: "string" },
	{ key: SETTING_KEYS.AI_MODEL_COMPANY_PROFILER, value: "openai/gpt-4.1-mini", category: "ai", label: "Company Profiler Model", valueType: "string" },
	{ key: SETTING_KEYS.AI_MODEL_EMAIL_GENERATOR, value: "openai/gpt-4o-mini", category: "ai", label: "Email Generator Model", valueType: "string" },
	{ key: SETTING_KEYS.AI_MODEL_HTML_CONVERTER, value: "openai/gpt-4o-mini", category: "ai", label: "HTML Converter Model", valueType: "string" },
	{ key: SETTING_KEYS.AI_MODEL_REPLY_PERSONALIZER, value: "openai/o3-mini", category: "ai", label: "Reply Personalizer Model", valueType: "string" },
	{ key: SETTING_KEYS.AI_MODEL_SUBJECT_LINE_PICKER, value: "openai/gpt-4o-mini", category: "ai", label: "Subject Line Picker Model", valueType: "string" },

	// ── AI: Temperature ──
	{ key: SETTING_KEYS.AI_TEMPERATURE_DEFAULT, value: 0.7, category: "ai", label: "Default Temperature", valueType: "number" },
	{ key: SETTING_KEYS.AI_TEMPERATURE_COMPANY_PROFILER, value: 0.5, category: "ai", label: "Company Profiler Temperature", valueType: "number" },
	{ key: SETTING_KEYS.AI_TEMPERATURE_HTML_CONVERTER, value: 0.3, category: "ai", label: "HTML Converter Temperature", valueType: "number" },

	// ── AI: Prompts ──
	{ key: SETTING_KEYS.AI_PROMPT_BEHAVIOR_ANALYZER, value: BEHAVIOR_ANALYZER_PROMPT, category: "ai", label: "Behavior Analyzer Prompt", valueType: "text" },
	{ key: SETTING_KEYS.AI_PROMPT_SEQUENCE_GENERATOR, value: SEQUENCE_GENERATOR_PROMPT, category: "ai", label: "Sequence Generator Prompt", valueType: "text" },
	{ key: SETTING_KEYS.AI_PROMPT_WEBSITE_ANALYZER, value: WEBSITE_ANALYZER_PROMPT, category: "ai", label: "Website Analyzer Prompt", valueType: "text" },
	{ key: SETTING_KEYS.AI_PROMPT_COMPANY_PROFILER, value: COMPANY_PROFILER_PROMPT, category: "ai", label: "Company Profiler Prompt", valueType: "text" },
	{ key: SETTING_KEYS.AI_PROMPT_HTML_CONVERTER, value: EMAIL_HTML_CONVERTER_PROMPT, category: "ai", label: "Email HTML Converter Prompt", valueType: "text" },
	{ key: SETTING_KEYS.AI_PROMPT_REPLY_PERSONALIZER, value: REPLY_PERSONALIZER_PROMPT, category: "ai", label: "Reply Personalizer Prompt", valueType: "text" },
	{ key: SETTING_KEYS.AI_PROMPT_SUBJECT_LINE_PICKER, value: SUBJECT_LINE_PICKER_PROMPT, category: "ai", label: "Subject Line Picker Prompt", valueType: "text" },

	// ── AI: Content Limits ──
	{ key: SETTING_KEYS.AI_LIMIT_WEBSITE_MARKDOWN_CHARS, value: 15000, category: "ai", label: "Website Markdown Char Limit", valueType: "number" },
	{ key: SETTING_KEYS.AI_LIMIT_COMPANY_CONTENT_CHARS, value: 10000, category: "ai", label: "Company Content Char Limit", valueType: "number" },
	{ key: SETTING_KEYS.AI_LIMIT_SCRAPER_FALLBACK_CHARS, value: 20000, category: "ai", label: "Scraper Fallback Char Limit", valueType: "number" },
	{ key: SETTING_KEYS.AI_RETRY_MAX_RETRIES, value: 3, category: "ai", label: "Max API Retries", valueType: "number" },

	// ── Email ──
	{ key: SETTING_KEYS.EMAIL_SENDER_NAME, value: "KUNCI AI SDR", category: "email", label: "Sender Name", valueType: "string" },
	{ key: SETTING_KEYS.EMAIL_SENDER_COMPANY, value: "KUNCI.AI", category: "email", label: "Sender Company", valueType: "string" },
	{ key: SETTING_KEYS.EMAIL_SENDER_EMAIL, value: "", category: "email", label: "Sender Email", valueType: "string", description: "Overrides env.SENDER_EMAIL if set" },
	{ key: SETTING_KEYS.EMAIL_COLOR_PRIMARY, value: "#2563eb", category: "email", label: "Primary Color", valueType: "string" },
	{ key: SETTING_KEYS.EMAIL_COLOR_ACCENT, value: "#f97316", category: "email", label: "Accent Color", valueType: "string" },
	{ key: SETTING_KEYS.EMAIL_COLOR_CTA, value: "#16a34a", category: "email", label: "CTA Button Color", valueType: "string" },
	{ key: SETTING_KEYS.EMAIL_COLOR_TEXT, value: "#374151", category: "email", label: "Text Color", valueType: "string" },
	{ key: SETTING_KEYS.EMAIL_COLOR_BACKGROUND, value: "#ffffff", category: "email", label: "Background Color", valueType: "string" },
	{ key: SETTING_KEYS.EMAIL_FONT_FAMILY, value: "Arial, Helvetica, sans-serif", category: "email", label: "Font Family", valueType: "string" },

	// ── Pipeline ──
	{ key: SETTING_KEYS.PIPELINE_EMAIL_SEQUENCE_COUNT, value: 3, category: "pipeline", label: "Email Sequence Count", valueType: "number" },
	{ key: SETTING_KEYS.PIPELINE_BULK_IMPORT_MAX, value: 100, category: "pipeline", label: "Max Bulk Import Leads", valueType: "number" },

	// ── Scheduler ──
	{ key: SETTING_KEYS.SCHEDULER_CRON_EXPRESSION, value: "30 9 * * *", category: "scheduler", label: "Follow-up Cron Expression", valueType: "string" },
	{ key: SETTING_KEYS.SCHEDULER_CRON_TIMEZONE, value: "UTC", category: "scheduler", label: "Cron Timezone", valueType: "string" },
	{ key: SETTING_KEYS.SCHEDULER_FOLLOWUP_DELAY_DAYS, value: 4, category: "scheduler", label: "Follow-up Delay (days)", valueType: "number" },
	{ key: SETTING_KEYS.SCHEDULER_ENABLED, value: true, category: "scheduler", label: "Scheduler Enabled", valueType: "boolean" },
]
