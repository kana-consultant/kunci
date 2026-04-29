import type { BehaviorAnalysis } from "#/domain/behavior-analysis/behavior-analysis.ts"
import type { Lead } from "#/domain/lead/lead.ts"
import type {
	EmailTemplateInput,
	GeneratedSequence,
	PersonalizedReply,
} from "#/domain/ports/ai-service.ts"
import { callOpenRouter } from "./client.ts"
import {
	EMAIL_HTML_CONVERTER_PROMPT,
	REPLY_PERSONALIZER_PROMPT,
	SEQUENCE_GENERATOR_PROMPT,
	SUBJECT_LINE_PICKER_PROMPT,
} from "./prompts/index.ts"

export async function generateEmailSequence(
	apiKey: string,
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
	})
}

export async function convertToHtml(
	apiKey: string,
	content: string,
): Promise<string> {
	return callOpenRouter<string>(apiKey, {
		model: "openai/gpt-4o-mini",
		messages: [
			{ role: "system", content: EMAIL_HTML_CONVERTER_PROMPT },
			{ role: "user", content: content },
		],
		temperature: 0.3,
	})
}

export async function personalizeReply(
	apiKey: string,
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
				additionalProperties: false,
			},
		},
	})
}

export async function pickSubjectLine(
	apiKey: string,
	lead: Lead,
	variations: string[],
): Promise<string> {
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
				additionalProperties: false,
			},
		},
	})
	return result.subject_line
}
