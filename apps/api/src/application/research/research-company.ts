import type { Lead } from "#/domain/lead/lead.ts"
import type { LeadRepository } from "#/domain/lead/lead-repository.ts"
import type { AIService, WebsiteAnalysis } from "#/domain/ports/ai-service.ts"
import type {
	LinkedInProfileContext,
	LinkedInService,
} from "#/domain/ports/linkedin-service.ts"
import type { Logger } from "#/domain/ports/logger.ts"
import type { ScraperService } from "#/domain/ports/scraper-service.ts"

interface ResearchCompanyDeps {
	leadRepo: LeadRepository
	scraper: ScraperService
	linkedin: LinkedInService
	ai: AIService
	logger: Logger
}

export interface CompanyResearchResult {
	rawMarkdown: string
	metadata: { title?: string; description?: string }
	websiteAnalysis: WebsiteAnalysis
	companyProfile: string
	linkedinProfile: LinkedInProfileContext | null
}

export function makeResearchCompanyUseCase(deps: ResearchCompanyDeps) {
	return async (lead: Lead): Promise<CompanyResearchResult> => {
		// Mark as researching
		await deps.leadRepo.update(lead.id, { replyStatus: "researching" })

		try {
			// Step 1: Scrape website with Deepcrawl
			deps.logger.info({ url: lead.companyWebsite }, "Scraping company website")
			const scraped = await deps.scraper.readUrl(lead.companyWebsite)

			if (!scraped.success || !scraped.markdown) {
				throw new Error(`Failed to scrape website: ${lead.companyWebsite}`)
			}

			// Step 2: AI analyze website content (P3)
			deps.logger.info({ leadId: lead.id }, "Analyzing website content")
			const websiteAnalysis = await deps.ai.analyzeWebsite(scraped.markdown)

			// Step 3: Enrich LinkedIn context without blocking the core research path
			const linkedinProfile = await enrichLinkedInContext(deps, lead)

			// Step 4: AI build company profile (P4)
			deps.logger.info({ leadId: lead.id }, "Building company profile")
			const companyProfile = await deps.ai.buildCompanyProfile({
				websiteMarkdown: scraped.markdown,
				metadata: scraped.metadata ?? {},
				analysis: websiteAnalysis,
				linkedinProfile,
			})

			// Save research to lead and mark as ready
			await deps.leadRepo.update(lead.id, {
				companyResearch: companyProfile,
				replyStatus: "ready",
			})

			return {
				rawMarkdown: scraped.markdown,
				metadata: scraped.metadata ?? {},
				websiteAnalysis,
				companyProfile,
				linkedinProfile,
			}
		} catch (error) {
			await deps.leadRepo.update(lead.id, { replyStatus: "research_failed" })
			throw error
		}
	}
}

async function enrichLinkedInContext(
	deps: Pick<ResearchCompanyDeps, "linkedin" | "logger">,
	lead: Lead,
): Promise<LinkedInProfileContext | null> {
	try {
		return await deps.linkedin.enrichProfile(lead.linkedinUrl)
	} catch (error) {
		deps.logger.warn({ leadId: lead.id, error }, "LinkedIn enrichment skipped")
		return null
	}
}
