/**
 * Port for web scraping operations.
 * Implementation: infrastructure/scraper/deepcrawl-service.ts
 * Provider: Deepcrawl SDK (open-source Firecrawl alternative)
 */
export interface ScraperService {
	/** Full page context: markdown + metadata + HTML */
	readUrl(url: string): Promise<ScrapedPage>

	/** Lightweight: markdown only */
	getMarkdown(url: string): Promise<string>
}

export interface ScrapedPage {
	success: boolean
	markdown: string | null
	metadata: {
		title?: string
		description?: string
	} | null
	cleanedHtml: string | null
}
