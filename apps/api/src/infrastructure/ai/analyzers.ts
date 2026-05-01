import type { SettingsService } from "#/application/shared/settings-service.ts"
import type { BehaviorAnalysis } from "#/domain/behavior-analysis/behavior-analysis.ts"
import type { Lead } from "#/domain/lead/lead.ts"
import type {
	CompanyDataInput,
	WebsiteAnalysis,
} from "#/domain/ports/ai-service.ts"
import { SETTING_KEYS } from "#/domain/settings/setting-keys.ts"
import { callOpenRouter } from "./client.ts"
import { PromptLoader } from "./prompt-loader.ts"

export async function analyzeBehavior(
	apiKey: string,
	settings: SettingsService,
	lead: Lead,
	companyProfile: string,
): Promise<BehaviorAnalysis> {
	const promptLoader = new PromptLoader(settings)
	const prompt = await promptLoader.getBehaviorAnalyzerPrompt()
	const model = await settings.get<string>(
		SETTING_KEYS.AI_MODEL_BEHAVIOR_ANALYZER,
		"openai/gpt-4o",
	)
	const maxRetries = await settings.get<number>(
		SETTING_KEYS.AI_RETRY_MAX_RETRIES,
		3,
	)

	const result = await callOpenRouter<
		Omit<BehaviorAnalysis, "id" | "leadId" | "createdAt">
	>(
		apiKey,
		{
			model,
			messages: [
				{ role: "system", content: prompt },
				{
					role: "user",
					content: `Lead Name: ${lead.fullName}\nEmail: ${lead.email}\nCompany: ${lead.companyName}\nWebsite: ${lead.companyWebsite}\nLinkedIn: ${lead.linkedinUrl ?? "Not provided"}\nPain Points: ${lead.painPoints ?? "Not specified"}\n\nCompany Profile:\n${companyProfile}`,
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
					additionalProperties: false,
				},
			},
		},
		maxRetries,
	)

	return {
		id: "",
		leadId: lead.id,
		createdAt: new Date(),
		...result,
	}
}

export async function analyzeWebsite(
	apiKey: string,
	settings: SettingsService,
	websiteMarkdown: string,
): Promise<WebsiteAnalysis> {
	const promptLoader = new PromptLoader(settings)
	const prompt = await promptLoader.getWebsiteAnalyzerPrompt()
	const model = await settings.get<string>(
		SETTING_KEYS.AI_MODEL_WEBSITE_ANALYZER,
		"openai/o3-mini",
	)
	const maxRetries = await settings.get<number>(
		SETTING_KEYS.AI_RETRY_MAX_RETRIES,
		3,
	)
	const maxLength = await settings.get<number>(
		SETTING_KEYS.AI_LIMIT_WEBSITE_MARKDOWN_CHARS,
		15000,
	)

	return callOpenRouter<WebsiteAnalysis>(
		apiKey,
		{
			model,
			messages: [
				{ role: "system", content: prompt },
				{ role: "user", content: websiteMarkdown.slice(0, maxLength) },
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
					required: [
						"brandName",
						"tagline",
						"industryCategory",
						"keyOfferings",
						"valueProposition",
						"targetAudience",
						"callsToAction",
					],
					additionalProperties: false,
				},
			},
		},
		maxRetries,
	)
}

export async function buildCompanyProfile(
	apiKey: string,
	settings: SettingsService,
	data: CompanyDataInput,
): Promise<string> {
	const promptLoader = new PromptLoader(settings)
	const prompt = await promptLoader.getCompanyProfilerPrompt()
	const model = await settings.get<string>(
		SETTING_KEYS.AI_MODEL_COMPANY_PROFILER,
		"openai/gpt-4.1-mini",
	)
	const maxRetries = await settings.get<number>(
		SETTING_KEYS.AI_RETRY_MAX_RETRIES,
		3,
	)
	const temperature = await settings.get<number>(
		SETTING_KEYS.AI_TEMPERATURE_COMPANY_PROFILER,
		0.5,
	)
	const maxLength = await settings.get<number>(
		SETTING_KEYS.AI_LIMIT_COMPANY_CONTENT_CHARS,
		10000,
	)

	return callOpenRouter<string>(
		apiKey,
		{
			model,
			messages: [
				{ role: "system", content: prompt },
				{
					role: "user",
					content: `Website Title: ${data.metadata.title ?? "Unknown"}\nDescription: ${data.metadata.description ?? "N/A"}\n\nBrand: ${data.analysis.brandName}\nIndustry: ${data.analysis.industryCategory}\nOfferings: ${data.analysis.keyOfferings}\nValue Prop: ${data.analysis.valueProposition}\nAudience: ${data.analysis.targetAudience}\n\nWebsite Content:\n${data.websiteMarkdown.slice(0, maxLength)}`,
				},
			],
			temperature,
		},
		maxRetries,
	)
}
