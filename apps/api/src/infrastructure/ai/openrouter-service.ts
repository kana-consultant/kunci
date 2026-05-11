/**
 * OpenRouter AI Service — Native TypeScript (no SDK)
 * Implements AIService port using fetch() → OpenRouter API
 */

import type { SettingsService } from "#/application/shared/settings-service.ts"
import type { BehaviorAnalysis } from "#/domain/behavior-analysis/behavior-analysis.ts"
import type { Lead } from "#/domain/lead/lead.ts"
import type {
	AIService,
	ChatTurn,
	CompanyDataInput,
	EmailTemplateInput,
} from "#/domain/ports/ai-service.ts"
import {
	analyzeBehavior,
	analyzeWebsite,
	buildCompanyProfile,
} from "./analyzers.ts"
import {
	classifyIntent,
	convertToHtml,
	generateChatReply,
	generateEmailSequence,
	personalizeReply,
	pickSubjectLine,
} from "./generators.ts"

export interface OpenRouterConfig {
	apiKey: string
	settings: SettingsService
	defaultModel?: string
}

// ── Factory ──────────────────────────────────────────────────────────────────

export function createOpenRouterService(config: OpenRouterConfig): AIService {
	const { apiKey } = config

	return {
		analyzeBehavior: (lead: Lead, companyProfile: string) =>
			analyzeBehavior(apiKey, config.settings, lead, companyProfile),

		generateEmailSequence: (lead: Lead, analysis: BehaviorAnalysis) =>
			generateEmailSequence(apiKey, config.settings, lead, analysis),

		analyzeWebsite: (websiteMarkdown: string) =>
			analyzeWebsite(apiKey, config.settings, websiteMarkdown),

		buildCompanyProfile: (data: CompanyDataInput) =>
			buildCompanyProfile(apiKey, config.settings, data),

		convertToHtml: (content: string) =>
			convertToHtml(apiKey, config.settings, content),

		personalizeReply: (
			lead: Lead,
			replyText: string,
			template: EmailTemplateInput,
		) => personalizeReply(apiKey, config.settings, lead, replyText, template),

		pickSubjectLine: (lead: Lead, variations: string[]) =>
			pickSubjectLine(apiKey, config.settings, lead, variations),

		classifyIntent: (lead: Lead, history: ChatTurn[], replyText: string) =>
			classifyIntent(apiKey, config.settings, lead, history, replyText),

		generateChatReply: (lead: Lead, history: ChatTurn[], latest: string) =>
			generateChatReply(apiKey, config.settings, lead, history, latest),
	}
}
