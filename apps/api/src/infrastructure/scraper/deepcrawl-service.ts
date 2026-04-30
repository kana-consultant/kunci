/**
 * Deepcrawl Web Scraping Service
 * Implements ScraperService port using Deepcrawl SDK
 */

import type {
  ScrapedPage,
  ScraperService,
} from "#/domain/ports/scraper-service.ts"
import { logger } from "#/infrastructure/observability/logger.ts"

interface DeepcrawlConfig {
  apiKey: string
  baseUrl?: string
}

export function createDeepcrawlService(
  config: DeepcrawlConfig,
): ScraperService {
  // Dynamic import to handle the SDK — avoids issues if not installed yet
  let clientPromise: Promise<any> | null = null

  async function getClient() {
    if (!clientPromise) {
      clientPromise = import("deepcrawl").then(({ DeepcrawlApp }) => {
        return new DeepcrawlApp({
          apiKey: config.apiKey,
          ...(config.baseUrl ? { baseUrl: config.baseUrl } : {}),
        })
      })
    }
    return clientPromise
  }

  return {
    async readUrl(url: string): Promise<ScrapedPage> {
      try {
        const client = await getClient()
        const result = await client.readUrl(url, {
          markdown: true,
          metadata: true,
          cleanedHtml: true,
        })

        logger.info({ url, success: result.success }, "Deepcrawl readUrl")

        return {
          success: result.success ?? false,
          markdown: result.markdown ?? null,
          metadata: result.metadata
            ? {
                title: result.metadata.title,
                description: result.metadata.description,
              }
            : null,
          cleanedHtml: result.cleanedHtml ?? null,
        }
      } catch (error) {
        logger.error({ url, error }, "Deepcrawl readUrl failed")

        // Graceful degradation — try basic fetch as fallback
        return fallbackScrape(url)
      }
    },

    async getMarkdown(url: string): Promise<string> {
      try {
        const client = await getClient()
        const markdown = await client.getMarkdown(url)
        return markdown ?? ""
      } catch (error) {
        logger.error({ url, error }, "Deepcrawl getMarkdown failed")
        // Fallback: basic fetch
        const result = await fallbackScrape(url)
        return result.markdown ?? ""
      }
    },
  }
}

/**
 * Basic fallback scraper when Deepcrawl is unavailable.
 * Fetches raw HTML and strips tags for a rough markdown.
 */
async function fallbackScrape(url: string): Promise<ScrapedPage> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; KUNCI-Bot/1.0; +https://kunci.dev)",
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      return {
        success: false,
        markdown: null,
        metadata: null,
        cleanedHtml: null,
      }
    }

    const html = await response.text()

    // Extract title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is)
    const descMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/is,
    )

    // Very basic HTML → text conversion
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 20000)

    return {
      success: true,
      markdown: text,
      metadata: {
        title: titleMatch?.[1]?.trim(),
        description: descMatch?.[1]?.trim(),
      },
      cleanedHtml: null,
    }
  } catch {
    return { success: false, markdown: null, metadata: null, cleanedHtml: null }
  }
}
