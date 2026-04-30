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

export interface OpenRouterConfig {
  apiKey: string
  defaultModel?: string
}

// ── Factory ──────────────────────────────────────────────────────────────────

export function createOpenRouterService(config: OpenRouterConfig): AIService {
  const { apiKey } = config

  return {
    analyzeBehavior: (lead: Lead, companyProfile: string) =>
      analyzeBehavior(apiKey, lead, companyProfile),

    generateEmailSequence: (lead: Lead, analysis: BehaviorAnalysis) =>
      generateEmailSequence(apiKey, lead, analysis),

    analyzeWebsite: (websiteMarkdown: string) =>
      analyzeWebsite(apiKey, websiteMarkdown),

    buildCompanyProfile: (data: CompanyDataInput) =>
      buildCompanyProfile(apiKey, data),

    convertToHtml: (content: string) => convertToHtml(apiKey, content),

    personalizeReply: (
      lead: Lead,
      replyText: string,
      template: EmailTemplateInput,
    ) => personalizeReply(apiKey, lead, replyText, template),

    pickSubjectLine: (lead: Lead, variations: string[]) =>
      pickSubjectLine(apiKey, lead, variations),
  }
}
