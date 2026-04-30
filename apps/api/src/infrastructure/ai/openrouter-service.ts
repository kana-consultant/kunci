/**
 * OpenRouter AI Service — Native TypeScript (no SDK)
 * Implements AIService port using fetch() → OpenRouter API
 */

import type { BehaviorAnalysis } from "#/domain/behavior-analysis/behavior-analysis.ts"
import type { Lead } from "#/domain/lead/lead.ts"
import type {
	AIService,
	CompanyDataInput,
	EmailTemplateInput,
} from "#/domain/ports/ai-service.ts"

import {
	analyzeBehavior,
	analyzeWebsite,
	buildCompanyProfile,
} from "./analyzers.ts"
import {
	convertToHtml,
	generateEmailSequence,
	personalizeReply,
	pickSubjectLine,
} from "./generators.ts"

import type { SettingsService } from "#/application/shared/settings-service.ts"

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

		generateEmailSequence: (
			lead: Lead,
			analysis: BehaviorAnalysis,
			senderInfo?: { name: string; company: string },
		) => generateEmailSequence(apiKey, config.settings, lead, analysis, senderInfo),

		analyzeWebsite: (websiteMarkdown: string) =>
			analyzeWebsite(apiKey, config.settings, websiteMarkdown),

		buildCompanyProfile: (data: CompanyDataInput) =>
			buildCompanyProfile(apiKey, config.settings, data),

		convertToHtml: (content: string) => convertToHtml(apiKey, config.settings, content),

		personalizeReply: (
			lead: Lead,
			replyText: string,
			template: EmailTemplateInput,
			senderInfo?: { name: string; company: string },
		) => personalizeReply(apiKey, config.settings, lead, replyText, template, senderInfo),

		pickSubjectLine: (lead: Lead, variations: string[]) =>
			pickSubjectLine(apiKey, config.settings, lead, variations),
	}
}
