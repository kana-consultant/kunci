/**
 * Cheap ASEAN locale inference from an email address.
 *
 * Strategy: pull the public-suffix portion of the email's domain and map
 * known ccTLDs to (country, locale, language, timezone). Falls back to
 * Singapore/English when nothing matches because that's the most common
 * regional default for B2B in ASEAN.
 *
 * Why deterministic + offline: this runs in the hot path of bulk import.
 * Anything richer (geo-IP, AI inference) happens later in the enrichment
 * use case, which can overwrite these fields.
 */

export interface InferredLocale {
	country: string | null
	locale: string | null
	language: string | null
	timezone: string | null
}

interface CountryProfile {
	country: string
	locale: string
	language: string
	timezone: string
}

const TLD_TO_PROFILE: Record<string, CountryProfile> = {
	id: {
		country: "ID",
		locale: "id-ID",
		language: "id",
		timezone: "Asia/Jakarta",
	},
	sg: {
		country: "SG",
		locale: "en-SG",
		language: "en",
		timezone: "Asia/Singapore",
	},
	my: {
		country: "MY",
		locale: "en-MY",
		language: "en",
		timezone: "Asia/Kuala_Lumpur",
	},
	th: {
		country: "TH",
		locale: "th-TH",
		language: "th",
		timezone: "Asia/Bangkok",
	},
	ph: {
		country: "PH",
		locale: "en-PH",
		language: "en",
		timezone: "Asia/Manila",
	},
	vn: {
		country: "VN",
		locale: "vi-VN",
		language: "vi",
		timezone: "Asia/Ho_Chi_Minh",
	},
	kh: {
		country: "KH",
		locale: "en-KH",
		language: "en",
		timezone: "Asia/Phnom_Penh",
	},
	la: {
		country: "LA",
		locale: "en-LA",
		language: "en",
		timezone: "Asia/Vientiane",
	},
	mm: {
		country: "MM",
		locale: "en-MM",
		language: "en",
		timezone: "Asia/Yangon",
	},
	bn: {
		country: "BN",
		locale: "en-BN",
		language: "en",
		timezone: "Asia/Brunei",
	},
}

/** Free-mail providers that reveal nothing about the user's country. */
const FREE_MAIL_DOMAINS = new Set([
	"gmail.com",
	"yahoo.com",
	"hotmail.com",
	"outlook.com",
	"icloud.com",
	"protonmail.com",
	"proton.me",
])

export function inferLocaleFromEmail(email: string): InferredLocale {
	const domain = email.split("@")[1]?.toLowerCase()
	if (!domain) return empty()
	if (FREE_MAIL_DOMAINS.has(domain)) return empty()

	const labels = domain.split(".")
	// Check the last two labels (e.g. "co.id" → "id", "kana.id" → "id").
	for (let i = labels.length - 1; i >= 0; i--) {
		const label = labels[i]
		const profile = TLD_TO_PROFILE[label]
		if (profile) return { ...profile }
	}

	return empty()
}

function empty(): InferredLocale {
	return { country: null, locale: null, language: null, timezone: null }
}
