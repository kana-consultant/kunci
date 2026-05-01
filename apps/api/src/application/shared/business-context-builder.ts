import { SETTING_KEYS } from "#/domain/settings/setting-keys.ts"
import type { SettingsService } from "./settings-service.ts"

export interface Offering {
	name: string
	type: "product" | "service"
	description: string
	keyBenefits: string[]
}

export interface BusinessContext {
	name: string
	description: string
	industry: string
	valueProposition: string
	targetMarket: string
	toneOfVoice: string
	website: string
	offerings: Offering[]
}

export async function buildBusinessContext(
	settings: SettingsService,
): Promise<BusinessContext> {
	const [
		name,
		description,
		industry,
		valueProposition,
		targetMarket,
		toneOfVoice,
		website,
		offerings,
	] = await Promise.all([
		settings.get<string>(SETTING_KEYS.BUSINESS_NAME, ""),
		settings.get<string>(SETTING_KEYS.BUSINESS_DESCRIPTION, ""),
		settings.get<string>(SETTING_KEYS.BUSINESS_INDUSTRY, ""),
		settings.get<string>(SETTING_KEYS.BUSINESS_VALUE_PROPOSITION, ""),
		settings.get<string>(SETTING_KEYS.BUSINESS_TARGET_MARKET, ""),
		settings.get<string>(SETTING_KEYS.BUSINESS_TONE_OF_VOICE, "professional"),
		settings.get<string>(SETTING_KEYS.BUSINESS_WEBSITE, ""),
		settings.get<Offering[]>(SETTING_KEYS.BUSINESS_OFFERINGS, []),
	])

	return {
		name,
		description,
		industry,
		valueProposition,
		targetMarket,
		toneOfVoice,
		website,
		offerings,
	}
}

export function formatBusinessContextForPrompt(ctx: BusinessContext): string {
	if (!ctx.name && !ctx.description) {
		return "" // No business profile configured yet
	}

	const lines = [
		`\n**About the Sender's Company:**`,
		ctx.name && `- Company: ${ctx.name}`,
		ctx.industry && `- Industry: ${ctx.industry}`,
		ctx.description && `- Description: ${ctx.description}`,
		ctx.valueProposition && `- Value Proposition: ${ctx.valueProposition}`,
		ctx.targetMarket && `- Target Market: ${ctx.targetMarket}`,
		ctx.website && `- Website: ${ctx.website}`,
	].filter(Boolean)

	if (ctx.offerings && ctx.offerings.length > 0) {
		lines.push(`\n**Products & Services Offered:**`)
		for (const o of ctx.offerings.slice(0, 10)) {
			const type = o.type === "service" ? "🔧 Service" : "📦 Product"
			lines.push(`- ${type}: ${o.name} — ${o.description}`)
			if (o.keyBenefits && o.keyBenefits.length > 0) {
				lines.push(`  Benefits: ${o.keyBenefits.join(", ")}`)
			}
		}
	}

	if (ctx.toneOfVoice && ctx.toneOfVoice !== "professional") {
		lines.push(`\n**Tone:** Write in a ${ctx.toneOfVoice} tone.`)
	}

	return lines.join("\n")
}
