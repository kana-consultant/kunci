import type { CompanyDataInput, WebsiteAnalysis } from "#/domain/ports/ai-service.ts"
import type { BehaviorAnalysis } from "#/domain/behavior-analysis/behavior-analysis.ts"
import type { Lead } from "#/domain/lead/lead.ts"
import { callOpenRouter } from "./client.ts"
import {
	BEHAVIOR_ANALYZER_PROMPT,
	COMPANY_PROFILER_PROMPT,
	WEBSITE_ANALYZER_PROMPT,
} from "./prompts/index.ts"

export async function analyzeBehavior(
	apiKey: string,
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
				additionalProperties: false,
			},
		},
	})

	return {
		id: "",
		leadId: lead.id,
		createdAt: new Date(),
		...result,
	}
}

export async function analyzeWebsite(apiKey: string, websiteMarkdown: string): Promise<WebsiteAnalysis> {
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
				additionalProperties: false,
			},
		},
	})
}

export async function buildCompanyProfile(apiKey: string, data: CompanyDataInput): Promise<string> {
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
}
