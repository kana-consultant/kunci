import { beforeEach, describe, expect, it, vi } from "vitest"
import { createLinkedInService } from "./linkedin-service.ts"

describe("createLinkedInService", () => {
	const scraper = {
		readUrl: vi.fn(),
		getMarkdown: vi.fn(),
	}
	const logger = {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	}

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("returns url-only context when crawling is not allowed", async () => {
		const service = createLinkedInService({
			allowCrawling: false,
			scraper,
			logger,
		})

		const result = await service.enrichProfile(
			"https://id.linkedin.com/in/jane",
		)

		expect(result).toMatchObject({
			normalizedUrl: "https://www.linkedin.com/in/jane",
			profileType: "member",
			publicIdentifier: "jane",
			status: "url_only",
			markdown: null,
		})
		expect(scraper.readUrl).not.toHaveBeenCalled()
	})

	it("scrapes LinkedIn when crawling permission is confirmed", async () => {
		scraper.readUrl.mockResolvedValue({
			success: true,
			markdown: "# Jane Doe",
			metadata: { title: "Jane Doe" },
			cleanedHtml: null,
		})
		const service = createLinkedInService({
			allowCrawling: true,
			scraper,
			logger,
		})

		const result = await service.enrichProfile("https://linkedin.com/in/jane")

		expect(scraper.readUrl).toHaveBeenCalledWith(
			"https://www.linkedin.com/in/jane",
		)
		expect(result).toMatchObject({
			status: "scraped",
			markdown: "# Jane Doe",
			metadata: { title: "Jane Doe" },
		})
	})

	it("returns unsupported context for non-LinkedIn URLs", async () => {
		const service = createLinkedInService({
			allowCrawling: true,
			scraper,
			logger,
		})

		const result = await service.enrichProfile("https://example.com/in/jane")

		expect(result).toMatchObject({
			status: "unsupported_url",
			profileType: "unknown",
			publicIdentifier: null,
		})
		expect(scraper.readUrl).not.toHaveBeenCalled()
	})

	it("does not scrape unsupported LinkedIn paths", async () => {
		const service = createLinkedInService({
			allowCrawling: true,
			scraper,
			logger,
		})

		const result = await service.enrichProfile("https://www.linkedin.com/feed/")

		expect(result).toMatchObject({
			status: "unsupported_url",
			profileType: "unknown",
			publicIdentifier: null,
		})
		expect(scraper.readUrl).not.toHaveBeenCalled()
	})
})
