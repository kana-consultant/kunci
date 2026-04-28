/**
 * OpenRouter AI Service — Native TypeScript (no SDK)
 * Implements AIService port using fetch() → OpenRouter API
 */

import type {
	AIService,
	CompanyDataInput,
	EmailTemplateInput,
	GeneratedSequence,
	PersonalizedReply,
	WebsiteAnalysis,
} from "#/domain/ports/ai-service.ts"
import type { BehaviorAnalysis } from "#/domain/behavior-analysis/behavior-analysis.ts"
import type { Lead } from "#/domain/lead/lead.ts"
import { logger } from "#/infrastructure/observability/logger.ts"
import {
	BEHAVIOR_ANALYZER_PROMPT,
	COMPANY_PROFILER_PROMPT,
	EMAIL_HTML_CONVERTER_PROMPT,
	REPLY_PERSONALIZER_PROMPT,
	SEQUENCE_GENERATOR_PROMPT,
	SUBJECT_LINE_PICKER_PROMPT,
	WEBSITE_ANALYZER_PROMPT,
} from "./prompts/index.ts"

interface OpenRouterConfig {
	apiKey: string
	defaultModel?: string
}

interface CallParams {
	model: string
	messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
	schema?: { name: string; schema: Record<string, unknown> }
	temperature?: number
}

interface OpenRouterResponse {
	choices: Array<{ message: { content: string } }>
	usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
}

async function callOpenRouter<T>(
	apiKey: string,
	params: CallParams,
): Promise<T> {
	const { model, messages, schema, temperature = 0.7 } = params
	const maxRetries = 3

	const body: Record<string, unknown> = { model, messages, temperature }

	if (schema) {
		body.response_format = {
			type: "json_schema",
			json_schema: {
				name: schema.name,
				strict: true,
				schema: { ...schema.schema, additionalProperties: false },
			},
		}
		body.plugins = [{ id: "response-healing" }]
	}

	let lastError: Error | null = null

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			const response = await fetch(
				"https://openrouter.ai/api/v1/chat/completions",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${apiKey}`,
						"Content-Type": "application/json",
						"X-OpenRouter-Title": "KUNCI AI SDR",
					},
					body: JSON.stringify(body),
				},
			)

			if (response.status === 429) {
				const retryAfter = response.headers.get("retry-after")
				const wait = retryAfter ? Number(retryAfter) * 1000 : 2 ** attempt * 1000
				logger.warn({ attempt, wait }, "OpenRouter rate limited, retrying")
				await sleep(wait)
				continue
			}

			if (!response.ok) {
				const errorText = await response.text()
				throw new Error(`OpenRouter ${response.status}: ${errorText}`)
			}

			const data: OpenRouterResponse = await response.json()
			const content = data.choices[0]?.message?.content

			if (!content) throw new Error("Empty response from OpenRouter")

			if (data.usage) {
				logger.debug(
					{ model, tokens: data.usage.total_tokens },
					"OpenRouter usage",
				)
			}

			// If schema was provided, parse as JSON; otherwise return raw string
			if (schema) {
				return JSON.parse(content) as T
			}
			return content as T
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error))
			logger.warn({ attempt, error: lastError.message }, "OpenRouter call failed")
			if (attempt < maxRetries - 1) {
				await sleep(2 ** attempt * 1000)
			}
		}
	}

	throw lastError ?? new Error("OpenRouter call failed after retries")
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── Factory ──────────────────────────────────────────────────────────────────

export function createOpenRouterService(config: OpenRouterConfig): AIService {
	const { apiKey } = config

	return {
		async analyzeBehavior(
			lead: Lead,
			companyProfile: string,
		): Promise<BehaviorAnalysis> {
			const result = await callOpenRouter<Omit<BehaviorAnalysis, "id" | "leadId" | "createdAt">>(apiKey, {
				model: "openai/gpt-4o",
				messages: [
					{ role: "system", content: BEHAVIOR_ANALYZER_PROMPT },
					{
						role: "user",
						content: `Lead Name: ${lead.fullName}\nEmail: ${lead.email}\nCompany: ${lead.companyName}\nWebsite: ${lead.companyWebsite}\nPain Points: ${lead.painPoints ?? "Not specified"}\n\nCompany Profile:\n${companyProfile}`,
					},
				],
				schema: {
					name: "behavior_analysis",
					schema: {
						type: "object",
						properties: {
							painPoints: { type: "string" },
							behavioralProfile: { type: "string" },
							journeyStage: { type: "string" },
							psychologicalTriggers: { type: "string" },
							optimalApproach: { type: "string" },
							conversionProbability: { type: "number" },
						},
						required: [
							"painPoints",
							"behavioralProfile",
							"journeyStage",
							"psychologicalTriggers",
							"optimalApproach",
							"conversionProbability",
						],
					},
				},
			})

			return {
				id: "",
				leadId: lead.id,
				createdAt: new Date(),
				...result,
			}
		},

		async generateEmailSequence(
			lead: Lead,
			analysis: BehaviorAnalysis,
		): Promise<GeneratedSequence> {
			return callOpenRouter<GeneratedSequence>(apiKey, {
				model: "openai/gpt-4o-mini",
				messages: [
					{ role: "system", content: SEQUENCE_GENERATOR_PROMPT },
					{
						role: "user",
						content: `Lead: ${lead.fullName} at ${lead.companyName}\nBehavioral Profile: ${analysis.behavioralProfile}\nPain Points: ${analysis.painPoints}\nJourney Stage: ${analysis.journeyStage}\nPsychological Triggers: ${analysis.psychologicalTriggers}\nOptimal Approach: ${analysis.optimalApproach}`,
					},
				],
				schema: {
					name: "email_sequence",
					schema: {
						type: "object",
						properties: {
							emails: {
								type: "array",
								items: {
									type: "object",
									properties: {
										emailNumber: { type: "number" },
										purpose: { type: "string" },
										subjectLines: { type: "array", items: { type: "string" } },
										content: { type: "string" },
										callToAction: { type: "string" },
										timing: { type: "string" },
										psychologicalTrigger: { type: "string" },
									},
									required: ["emailNumber", "purpose", "subjectLines", "content", "callToAction", "timing", "psychologicalTrigger"],
								},
							},
						},
						required: ["emails"],
					},
				},
			})
		},

		async analyzeWebsite(websiteMarkdown: string): Promise<WebsiteAnalysis> {
			return callOpenRouter<WebsiteAnalysis>(apiKey, {
				model: "openai/o3-mini",
				messages: [
					{ role: "system", content: WEBSITE_ANALYZER_PROMPT },
					{ role: "user", content: websiteMarkdown.slice(0, 15000) },
				],
				schema: {
					name: "website_analysis",
					schema: {
						type: "object",
						properties: {
							brandName: { type: "string" },
							tagline: { type: "string" },
							industryCategory: { type: "string" },
							keyOfferings: { type: "string" },
							valueProposition: { type: "string" },
							targetAudience: { type: "string" },
							callsToAction: { type: "string" },
						},
						required: ["brandName", "tagline", "industryCategory", "keyOfferings", "valueProposition", "targetAudience", "callsToAction"],
					},
				},
			})
		},

		async buildCompanyProfile(data: CompanyDataInput): Promise<string> {
			return callOpenRouter<string>(apiKey, {
				model: "openai/gpt-4.1-mini",
				messages: [
					{ role: "system", content: COMPANY_PROFILER_PROMPT },
					{
						role: "user",
						content: `Website Title: ${data.metadata.title ?? "Unknown"}\nDescription: ${data.metadata.description ?? "N/A"}\n\nBrand: ${data.analysis.brandName}\nIndustry: ${data.analysis.industryCategory}\nOfferings: ${data.analysis.keyOfferings}\nValue Prop: ${data.analysis.valueProposition}\nAudience: ${data.analysis.targetAudience}\n\nWebsite Content:\n${data.websiteMarkdown.slice(0, 10000)}`,
					},
				],
				temperature: 0.5,
			})
		},

		async convertToHtml(content: string): Promise<string> {
			return callOpenRouter<string>(apiKey, {
				model: "openai/gpt-4o-mini",
				messages: [
					{ role: "system", content: EMAIL_HTML_CONVERTER_PROMPT },
					{ role: "user", content: content },
				],
				temperature: 0.3,
			})
		},

		async personalizeReply(
			lead: Lead,
			replyText: string,
			template: EmailTemplateInput,
		): Promise<PersonalizedReply> {
			return callOpenRouter<PersonalizedReply>(apiKey, {
				model: "openai/o3-mini",
				messages: [
					{ role: "system", content: REPLY_PERSONALIZER_PROMPT },
					{
						role: "user",
						content: `Lead: ${lead.fullName} at ${lead.companyName}\nPain Points: ${lead.painPoints ?? "N/A"}\n\nTheir Reply:\n${replyText}\n\nEmail Template:\nContent: ${template.content}\nCTA: ${template.cta}\nTrigger: ${template.psychologicalTrigger}`,
					},
				],
				schema: {
					name: "personalized_reply",
					schema: {
						type: "object",
						properties: {
							subject: { type: "string" },
							content: { type: "string" },
							cta: { type: "string" },
						},
						required: ["subject", "content", "cta"],
					},
				},
			})
		},

		async pickSubjectLine(lead: Lead, variations: string[]): Promise<string> {
			const result = await callOpenRouter<{ subject_line: string }>(apiKey, {
				model: "openai/gpt-4o-mini",
				messages: [
					{ role: "system", content: SUBJECT_LINE_PICKER_PROMPT },
					{
						role: "user",
						content: `Lead: ${lead.fullName} at ${lead.companyName}\n\nSubject Line Variations:\n1. ${variations[0]}\n2. ${variations[1]}\n3. ${variations[2]}`,
					},
				],
				schema: {
					name: "subject_pick",
					schema: {
						type: "object",
						properties: { subject_line: { type: "string" } },
						required: ["subject_line"],
					},
				},
			})
			return result.subject_line
		},
	}
}
