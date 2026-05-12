import {
	buildBusinessContext,
	formatBusinessContextForPrompt,
} from "#/application/shared/business-context-builder.ts"
import type { SettingsService } from "#/application/shared/settings-service.ts"
import type { BehaviorAnalysis } from "#/domain/behavior-analysis/behavior-analysis.ts"
import {
	isReplyIntent,
	type ReplyIntent,
} from "#/domain/email-message/email-message.ts"
import type { Lead } from "#/domain/lead/lead.ts"
import type {
	ChatReplyResult,
	ChatTurn,
	EmailTemplateInput,
	GeneratedSequence,
	IntentClassification,
	PersonalizedReply,
} from "#/domain/ports/ai-service.ts"
import { SETTING_KEYS } from "#/domain/settings/setting-keys.ts"
import { formatLocaleContext } from "./locale-context.ts"
import { PromptLoader } from "./prompt-loader.ts"
import { callOpenRouterQueued } from "./queue.ts"

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

	return callOpenRouterQueued<GeneratedSequence>(
		apiKey,
		{
			model,
			messages: [
				{ role: "system", content: prompt },
				{
					role: "user",
					content: `Lead: ${lead.fullName} at ${lead.companyName}
${formatLocaleContext(lead)}
${businessContextStr}
LinkedIn: ${lead.linkedinUrl ?? "Not provided"}
Behavioral Profile: ${analysis.behavioralProfile}
Pain Points: ${analysis.painPoints}
Journey Stage: ${analysis.journeyStage}
Psychological Triggers: ${analysis.psychologicalTriggers}
Optimal Approach: ${analysis.optimalApproach}

CRITICAL: Follow the MARKET CONTEXT rules above strictly when choosing language, tone, greeting, and CTA framing. The lead is more likely to respond if the body matches their cultural and business context.`,
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

	return callOpenRouterQueued<string>(
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

	return callOpenRouterQueued<PersonalizedReply>(
		apiKey,
		{
			model,
			messages: [
				{ role: "system", content: prompt },
				{
					role: "user",
					content: `Lead: ${lead.fullName} at ${lead.companyName}
${formatLocaleContext(lead)}
${businessContextStr}
Pain Points: ${lead.painPoints ?? "N/A"}

Their Reply:
${replyText}

Email Template:
Content: ${template.content}
CTA: ${template.cta}
Trigger: ${template.psychologicalTrigger}

CRITICAL: Match the MARKET CONTEXT rules above for language and tone.`,
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

	const result = await callOpenRouterQueued<{ subject_line: string }>(
		apiKey,
		{
			model,
			messages: [
				{ role: "system", content: prompt },
				{
					role: "user",
					content: `Lead: ${lead.fullName} at ${lead.companyName}
${formatLocaleContext(lead)}

Subject Line Variations:
1. ${variations[0]}
2. ${variations[1]}
3. ${variations[2]}

When the market context implies a non-English body language, prefer the subject line that matches that language or that is short, neutral, and unlikely to read as a US-marketing template.`,
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

function formatHistoryForPrompt(history: ChatTurn[]): string {
	if (history.length === 0) return "(no prior messages)"
	return history
		.map((turn, i) => {
			const speaker = turn.role === "lead" ? "LEAD" : "AGENT"
			return `[${i + 1}] ${speaker}:\n${turn.text}`
		})
		.join("\n\n")
}

export async function classifyIntent(
	apiKey: string,
	settings: SettingsService,
	lead: Lead,
	history: ChatTurn[],
	replyText: string,
): Promise<IntentClassification> {
	const promptLoader = new PromptLoader(settings)
	const prompt = await promptLoader.getIntentClassifierPrompt()
	const model = await settings.get<string>(
		SETTING_KEYS.AI_MODEL_INTENT_CLASSIFIER,
		"openai/gpt-4o-mini",
	)
	const maxRetries = await settings.get<number>(
		SETTING_KEYS.AI_RETRY_MAX_RETRIES,
		3,
	)

	const result = await callOpenRouterQueued<{
		intent: string
		confidence: number
		reasoning: string
	}>(
		apiKey,
		{
			model,
			messages: [
				{ role: "system", content: prompt },
				{
					role: "user",
					content: `Lead: ${lead.fullName} at ${lead.companyName}
${formatLocaleContext(lead)}

Prior thread:
${formatHistoryForPrompt(history)}

Latest reply from lead:
${replyText}

NOTE: The lead may reply in their local language (Bahasa Indonesia, Thai, Vietnamese, etc.). Common opt-out phrases in those languages also count as "unsubscribe" (e.g. ID: "berhenti", "jangan kirim lagi"; TH: "ยกเลิก", "หยุดส่ง"; VN: "huỷ", "ngừng gửi").`,
				},
			],
			schema: {
				name: "intent_classification",
				schema: {
					type: "object",
					properties: {
						intent: {
							type: "string",
							enum: [
								"interested",
								"not_interested",
								"unsubscribe",
								"objection",
								"question",
								"neutral",
							],
						},
						confidence: { type: "number" },
						reasoning: { type: "string" },
					},
					required: ["intent", "confidence", "reasoning"],
					additionalProperties: false,
				},
			},
			temperature: 0,
		},
		maxRetries,
	)

	const intent: ReplyIntent = isReplyIntent(result.intent)
		? result.intent
		: "neutral"

	return {
		intent,
		confidence: result.confidence,
		reasoning: result.reasoning,
	}
}

export async function generateChatReply(
	apiKey: string,
	settings: SettingsService,
	lead: Lead,
	history: ChatTurn[],
	latestInbound: string,
): Promise<ChatReplyResult> {
	const businessCtx = await buildBusinessContext(settings)
	const businessContextStr = formatBusinessContextForPrompt(businessCtx)

	const promptLoader = new PromptLoader(settings)
	const prompt = await promptLoader.getChatReplyPrompt()
	const model = await settings.get<string>(
		SETTING_KEYS.AI_MODEL_CHAT_REPLY,
		"openai/gpt-4o",
	)
	const temperature = await settings.get<number>(
		SETTING_KEYS.AI_TEMPERATURE_DEFAULT,
		0.7,
	)
	const maxRetries = await settings.get<number>(
		SETTING_KEYS.AI_RETRY_MAX_RETRIES,
		3,
	)

	return callOpenRouterQueued<ChatReplyResult>(
		apiKey,
		{
			model,
			messages: [
				{ role: "system", content: prompt },
				{
					role: "user",
					content: `Lead profile:
- Name: ${lead.fullName}
- Company: ${lead.companyName}
- Pain points: ${lead.painPoints ?? "N/A"}

${formatLocaleContext(lead)}

${businessContextStr}

Full thread so far:
${formatHistoryForPrompt(history)}

The lead's latest message (respond to this):
${latestInbound}

CRITICAL: Stay in the language and tone defined by MARKET CONTEXT. If the lead's last message was in a different language than the body language defined above, switch to the lead's language for this reply.`,
				},
			],
			schema: {
				name: "chat_reply",
				schema: {
					type: "object",
					properties: {
						subject: { type: "string" },
						content: { type: "string" },
					},
					required: ["subject", "content"],
					additionalProperties: false,
				},
			},
			temperature,
		},
		maxRetries,
	)
}
