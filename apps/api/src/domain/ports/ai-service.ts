import type { BehaviorAnalysis } from "#/domain/behavior-analysis/behavior-analysis.ts"
import type { ReplyIntent } from "#/domain/email-message/email-message.ts"
import type { Lead } from "#/domain/lead/lead.ts"

/**
 * Port for AI/LLM operations.
 * Implementation: infrastructure/ai/openrouter-service.ts
 * Provider: OpenRouter API (native fetch, no SDK)
 */
export interface AIService {
	/** P1: Deep behavioral analysis of lead based on company data */
	analyzeBehavior(lead: Lead, companyProfile: string): Promise<BehaviorAnalysis>

	/** P2: Generate 3-email nurturing sequence */
	generateEmailSequence(
		lead: Lead,
		analysis: BehaviorAnalysis,
	): Promise<GeneratedSequence>

	/** P3: Extract business intelligence from website markdown */
	analyzeWebsite(websiteMarkdown: string): Promise<WebsiteAnalysis>

	/** P4: Build structured company profile from aggregated data */
	buildCompanyProfile(data: CompanyDataInput): Promise<string>

	/** P5: Convert raw JSON email content to professional HTML */
	convertToHtml(content: string): Promise<string>

	/** P6/P7: Personalize reply based on lead context and incoming reply */
	personalizeReply(
		lead: Lead,
		replyText: string,
		emailTemplate: EmailTemplateInput,
	): Promise<PersonalizedReply>

	/** P8: Select best subject line from 3 variations */
	pickSubjectLine(lead: Lead, variations: string[]): Promise<string>

	/** P9: Classify intent of an inbound reply */
	classifyIntent(
		lead: Lead,
		history: ChatTurn[],
		replyText: string,
	): Promise<IntentClassification>

	/** P10: Generate next AI chat reply from full thread history */
	generateChatReply(
		lead: Lead,
		history: ChatTurn[],
		latestInbound: string,
	): Promise<ChatReplyResult>
}

export interface ChatTurn {
	role: "lead" | "agent"
	text: string
}

export interface IntentClassification {
	intent: ReplyIntent
	confidence: number
	reasoning: string
}

export interface ChatReplyResult {
	subject: string
	content: string
}

export interface GeneratedSequence {
	emails: Array<{
		emailNumber: 1 | 2 | 3
		purpose: string
		subjectLines: string[]
		content: string
		callToAction: string
		timing: string
		psychologicalTrigger: string
	}>
}

export interface WebsiteAnalysis {
	brandName: string
	tagline: string
	industryCategory: string
	keyOfferings: string
	valueProposition: string
	targetAudience: string
	callsToAction: string
}

export interface CompanyDataInput {
	websiteMarkdown: string
	metadata: { title?: string; description?: string }
	analysis: WebsiteAnalysis
}

export interface EmailTemplateInput {
	content: string
	cta: string
	psychologicalTrigger: string
}

export interface PersonalizedReply {
	subject: string
	content: string
	cta: string
}
