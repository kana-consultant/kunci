import type { Lead } from "#/domain/lead/lead.ts"
import type { LeadRepository } from "#/domain/lead/lead-repository.ts"
import type { AIService, EnrichedLeadData } from "#/domain/ports/ai-service.ts"
import type { Logger } from "#/domain/ports/logger.ts"
import type { ScraperService } from "#/domain/ports/scraper-service.ts"
import { inferLocaleFromEmail } from "./locale-inference.ts"

interface EnrichLeadDeps {
	leadRepo: LeadRepository
	scraper: ScraperService
	ai: AIService
	logger: Logger
}

export interface EnrichLeadResult {
	updatedLead: Lead
	signals: {
		recentSignals: string | null
		painPointHypothesis: string | null
		targetMarket: string | null
	}
}

/**
 * Self-enrichment for a lead: pulls homepage markdown via Deepcrawl, then
 * asks OpenRouter to extract structured B2B metadata (industry, size, country,
 * language, signals). Falls back to TLD-based locale inference when scraping
 * or AI parsing fails so the lead always ends up with *some* locale data.
 */
export function makeEnrichLeadUseCase(deps: EnrichLeadDeps) {
	return async (lead: Lead): Promise<EnrichLeadResult> => {
		const emailDomain = lead.email.split("@")[1]?.toLowerCase() ?? null
		const tldGuess = inferLocaleFromEmail(lead.email)

		let websiteMarkdown = ""
		try {
			websiteMarkdown = await deps.scraper.getMarkdown(lead.companyWebsite)
		} catch (err) {
			deps.logger.warn(
				{ leadId: lead.id, url: lead.companyWebsite, err },
				"Enrichment scrape failed; falling back to TLD-only inference",
			)
		}

		let enriched: EnrichedLeadData = emptyEnrichment()
		if (websiteMarkdown && websiteMarkdown.length > 50) {
			try {
				enriched = await deps.ai.enrichLead({
					websiteMarkdown,
					emailDomain,
					knownCompanyName: lead.companyName,
				})
			} catch (err) {
				deps.logger.warn(
					{ leadId: lead.id, err },
					"Enrichment AI parse failed; keeping TLD-only inference",
				)
			}
		}

		// Resolve final locale fields: prefer AI output, fall back to TLD inference,
		// then fall back to whatever is already on the lead.
		const country = enriched.country ?? tldGuess.country ?? lead.country
		const language = enriched.language ?? tldGuess.language ?? lead.language
		const locale =
			lead.locale ??
			tldGuess.locale ??
			deriveLocale(country, language) ??
			lead.locale
		const timezone = tldGuess.timezone ?? lead.timezone

		const updatedLead = await deps.leadRepo.update(lead.id, {
			country: country ?? null,
			locale: locale ?? null,
			language: language ?? null,
			timezone: timezone ?? null,
			companyIndustry: enriched.industry ?? lead.companyIndustry ?? null,
			companySize: enriched.companySize ?? lead.companySize ?? null,
			enrichedAt: new Date(),
		})

		deps.logger.info(
			{
				leadId: lead.id,
				country,
				language,
				industry: enriched.industry,
				size: enriched.companySize,
			},
			"Lead enriched",
		)

		return {
			updatedLead,
			signals: {
				recentSignals: enriched.recentSignals,
				painPointHypothesis: enriched.painPointHypothesis,
				targetMarket: enriched.targetMarket,
			},
		}
	}
}

function emptyEnrichment(): EnrichedLeadData {
	return {
		companyName: null,
		industry: null,
		companySize: null,
		country: null,
		language: null,
		targetMarket: null,
		recentSignals: null,
		painPointHypothesis: null,
	}
}

function deriveLocale(
	country: string | null,
	language: string | null,
): string | null {
	if (!country || !language) return null
	return `${language}-${country}`
}
