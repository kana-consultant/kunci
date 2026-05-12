import type { Lead } from "#/domain/lead/lead.ts"

/**
 * Per-market tone & language guidance injected into AI prompts.
 * The advice here is what changes B2B reply rates in ASEAN — keep it tight,
 * specific, and updatable in code rather than per-call.
 */
interface MarketProfile {
	displayName: string
	language: string
	tone: string
	rules: string[]
}

const MARKET_PROFILES: Record<string, MarketProfile> = {
	ID: {
		displayName: "Indonesia",
		language:
			"Bahasa Indonesia (professional, may mix common English business terms)",
		tone: "relationship-first, warm, respectful. Avoid hard sell or overly American directness.",
		rules: [
			"Open with a respectful greeting (e.g. 'Halo Pak/Bu <FirstName>,' — never just 'Hi').",
			"Reference local business context when natural (Jakarta, Surabaya, growing SME segment, etc.).",
			"Use 'Bapak/Ibu' or first name with 'Pak/Bu' — never overly informal.",
			"Soften the CTA: prefer 'apakah Bapak/Ibu bersedia ngobrol singkat?' over 'book a 15-min slot now'.",
			"Use Bahasa Indonesia for the body. English-language industry terms (CRM, SaaS, ROI) are fine inline.",
		],
	},
	SG: {
		displayName: "Singapore",
		language: "English (regional / Singapore business)",
		tone: "concise, professional, efficient. Singaporeans value brevity and competence.",
		rules: [
			"Keep sentences short. No fluff.",
			"Currency in SGD when relevant. Cite local references (HDB, MAS, IMDA) only if directly relevant.",
			"Avoid US-style hype words ('game-changer', 'crush it'). Sound credible.",
			"CTA can be direct: 'Open to a 15-min call this week?' is fine.",
		],
	},
	MY: {
		displayName: "Malaysia",
		language:
			"English (KL business). Bahasa Melayu only if the lead has used it first.",
		tone: "professional, warm, relationship-aware. Less formal than ID, less terse than SG.",
		rules: [
			"Use the lead's first name unless their title clearly suggests otherwise.",
			"Brief reference to local context (KL, Penang, ASEAN expansion) helps when relevant.",
			"Direct CTA is fine, but pair it with a soft option ('happy to share a quick deck instead if a call doesn't fit').",
		],
	},
	TH: {
		displayName: "Thailand",
		language:
			"Thai for the greeting/sign-off if confident; otherwise English with one polite Thai phrase. Default English body.",
		tone: "polite, respectful, soft. Avoid blunt 'book now' language.",
		rules: [
			"Use 'Khun <FirstName>' as the greeting.",
			"Soften any urgency. Frame CTAs as a question, never a demand.",
			"Keep formatting clean; avoid excessive emojis or bold.",
		],
	},
	VN: {
		displayName: "Vietnam",
		language:
			"Vietnamese for the greeting/sign-off if confident; English business body otherwise.",
		tone: "polite, formal at first touch, then warming as the thread progresses.",
		rules: [
			"Use 'Anh/Chị <FirstName>' as greeting.",
			"Reference local growth/digital transformation themes only when relevant.",
		],
	},
	PH: {
		displayName: "Philippines",
		language: "English (Philippine business)",
		tone: "warm, conversational, friendlier than SG/SG; still professional.",
		rules: ["First-name basis is fine.", "Casual is OK but not slangy."],
	},
}

const DEFAULT_PROFILE: MarketProfile = {
	displayName: "ASEAN (default)",
	language: "English",
	tone: "professional, concise, regionally aware.",
	rules: [
		"Match the language of the lead's email if it is not English.",
		"Avoid US-centric idioms. Sound human, not scripted.",
	],
}

export function formatLocaleContext(lead: Lead): string {
	const profile = pickProfile(lead.country)
	const rules = profile.rules.map((r) => `- ${r}`).join("\n")
	const localeLine = lead.locale ? `Locale tag: ${lead.locale}\n` : ""
	const tzLine = lead.timezone ? `Timezone: ${lead.timezone}\n` : ""
	return `=== MARKET CONTEXT ===
Country: ${profile.displayName} (${lead.country ?? "unknown"})
${localeLine}${tzLine}Preferred language for body: ${profile.language}
Tone: ${profile.tone}
Rules:
${rules}
======================`
}

function pickProfile(country: string | null): MarketProfile {
	if (!country) return DEFAULT_PROFILE
	return MARKET_PROFILES[country.toUpperCase()] ?? DEFAULT_PROFILE
}
