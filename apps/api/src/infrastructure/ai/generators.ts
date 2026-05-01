import {
	buildBusinessContext,
	formatBusinessContextForPrompt,
} from "#/application/shared/business-context-builder.ts"
import type { SettingsService } from "#/application/shared/settings-service.ts"
import type { BehaviorAnalysis } from "#/domain/behavior-analysis/behavior-analysis.ts"
import type { Lead } from "#/domain/lead/lead.ts"
import type {
	EmailTemplateInput,
	GeneratedSequence,
	PersonalizedReply,
} from "#/domain/ports/ai-service.ts"
import { SETTING_KEYS } from "#/domain/settings/setting-keys.ts"
import { callOpenRouter } from "./client.ts"
import { PromptLoader } from "./prompt-loader.ts"

export async function generateEmailSequence(
	apiKey: string,
	settings: SettingsService,
	lead: Lead,
	analysis: BehaviorAnalysis,
): Promise<GeneratedSequence> {
	const businessCtx = await buildBusinessContext(settings)
	const businessContextStr = formatBusinessContextForPrompt(businessCtx)

	const promptLoader = new PromptLoader(settings)
	const prompt = await promptLoader.getSequenceGeneratorPrompt()
	const model = await settings.get<string>(
		SETTING_KEYS.AI_MODEL_EMAIL_GENERATOR,
		"openai/gpt-4o-mini",
	)
	const maxRetries = await settings.get<number>(
		SETTING_KEYS.AI_RETRY_MAX_RETRIES,
		3,
	)

	return callOpenRouter<GeneratedSequence>(
		apiKey,
		{
			model,
			messages: [
				{ role: "system", content: prompt },
				{
					role: "user",
					content: `Lead: ${lead.fullName} at ${lead.companyName}
${businessContextStr}
Behavioral Profile: ${analysis.behavioralProfile}
Pain Points: ${analysis.painPoints}
Journey Stage: ${analysis.journeyStage}
Psychological Triggers: ${analysis.psychologicalTriggers}
Optimal Approach: ${analysis.optimalApproach}`,
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
								required: [
									"emailNumber",
									"purpose",
									"subjectLines",
									"content",
									"callToAction",
									"timing",
									"psychologicalTrigger",
								],
								additionalProperties: false,
							},
						},
					},
					required: ["emails"],
					additionalProperties: false,
				},
			},
		},
		maxRetries,
	)
}

export async function convertToHtml(
	apiKey: string,
	settings: SettingsService,
	content: string,
): Promise<string> {
	const promptLoader = new PromptLoader(settings)
	let prompt = await promptLoader.getEmailHtmlConverterPrompt()
	const model = await settings.get<string>(
		SETTING_KEYS.AI_MODEL_HTML_CONVERTER,
		"openai/gpt-4o-mini",
	)
	const maxRetries = await settings.get<number>(
		SETTING_KEYS.AI_RETRY_MAX_RETRIES,
		3,
	)
	const temperature = await settings.get<number>(
		SETTING_KEYS.AI_TEMPERATURE_HTML_CONVERTER,
		0.3,
	)

	// Inject dynamic color scheme
	const primaryColor = await settings.get<string>(
		SETTING_KEYS.EMAIL_COLOR_PRIMARY,
		"#2563eb",
	)
	const accentColor = await settings.get<string>(
		SETTING_KEYS.EMAIL_COLOR_ACCENT,
		"#f97316",
	)
	const ctaColor = await settings.get<string>(
		SETTING_KEYS.EMAIL_COLOR_CTA,
		"#16a34a",
	)
	const textColor = await settings.get<string>(
		SETTING_KEYS.EMAIL_COLOR_TEXT,
		"#374151",
	)
	const bgColor = await settings.get<string>(
		SETTING_KEYS.EMAIL_COLOR_BACKGROUND,
		"#ffffff",
	)
	const fontFamily = await settings.get<string>(
		SETTING_KEYS.EMAIL_FONT_FAMILY,
		"Arial, Helvetica, sans-serif",
	)

	prompt = prompt.replace(
		/Color Scheme:[\s\S]*?(?=Your response)/,
		`Color Scheme:\n- Primary: ${primaryColor}\n- Accent: ${accentColor}\n- CTA Buttons: ${ctaColor}\n- Text: ${textColor}\n- Background: ${bgColor}\n\nFonts:\n- ${fontFamily}\n\n`,
	)

	return callOpenRouter<string>(
		apiKey,
		{
			model,
			messages: [
				{ role: "system", content: prompt },
				{ role: "user", content: content },
			],
			temperature,
		},
		maxRetries,
	)
}

export async function personalizeReply(
	apiKey: string,
	settings: SettingsService,
	lead: Lead,
	replyText: string,
	template: EmailTemplateInput,
): Promise<PersonalizedReply> {
	const businessCtx = await buildBusinessContext(settings)
	const businessContextStr = formatBusinessContextForPrompt(businessCtx)

	const promptLoader = new PromptLoader(settings)
	const prompt = await promptLoader.getReplyPersonalizerPrompt()
	const model = await settings.get<string>(
		SETTING_KEYS.AI_MODEL_REPLY_PERSONALIZER,
		"openai/o3-mini",
	)
	const maxRetries = await settings.get<number>(
		SETTING_KEYS.AI_RETRY_MAX_RETRIES,
		3,
	)

	return callOpenRouter<PersonalizedReply>(
		apiKey,
		{
			model,
			messages: [
				{ role: "system", content: prompt },
				{
					role: "user",
					content: `Lead: ${lead.fullName} at ${lead.companyName}
${businessContextStr}
Pain Points: ${lead.painPoints ?? "N/A"}

Their Reply:
${replyText}

Email Template:
Content: ${template.content}
CTA: ${template.cta}
Trigger: ${template.psychologicalTrigger}`,
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
					additionalProperties: false,
				},
			},
		},
		maxRetries,
	)
}

export async function pickSubjectLine(
	apiKey: string,
	settings: SettingsService,
	lead: Lead,
	variations: string[],
): Promise<string> {
	const promptLoader = new PromptLoader(settings)
	const prompt = await promptLoader.getSubjectLinePickerPrompt()
	const model = await settings.get<string>(
		SETTING_KEYS.AI_MODEL_SUBJECT_LINE_PICKER,
		"openai/gpt-4o-mini",
	)
	const maxRetries = await settings.get<number>(
		SETTING_KEYS.AI_RETRY_MAX_RETRIES,
		3,
	)

	const result = await callOpenRouter<{ subject_line: string }>(
		apiKey,
		{
			model,
			messages: [
				{ role: "system", content: prompt },
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
					additionalProperties: false,
				},
			},
		},
		maxRetries,
	)
	return result.subject_line
}
