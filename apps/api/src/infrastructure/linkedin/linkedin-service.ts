import type {
	LinkedInProfileContext,
	LinkedInProfileType,
	LinkedInService,
} from "#/domain/ports/linkedin-service.ts"
import type { Logger } from "#/domain/ports/logger.ts"
import type { ScraperService } from "#/domain/ports/scraper-service.ts"

interface LinkedInServiceConfig {
	allowCrawling: boolean
	scraper: ScraperService
	logger: Logger
}

interface ParsedLinkedInUrl {
	sourceUrl: string
	normalizedUrl: string
	profileType: LinkedInProfileType
	publicIdentifier: string | null
}

const PROFILE_TYPES: Record<string, LinkedInProfileType> = {
	in: "member",
	pub: "member",
	company: "company",
	school: "school",
}

export function createLinkedInService(
	config: LinkedInServiceConfig,
): LinkedInService {
	return {
		async enrichProfile(url) {
			if (!url) return null

			const parsed = parseLinkedInUrl(url)
			if (!parsed) {
				return unsupportedUrlContext(url)
			}

			if (!isSupportedProfileUrl(parsed)) {
				return {
					...parsed,
					status: "unsupported_url",
					markdown: null,
					metadata: null,
					reason: "LinkedIn URL must be a member, company, or school profile.",
				}
			}

			if (!config.allowCrawling) {
				return {
					...parsed,
					status: "url_only",
					markdown: null,
					metadata: null,
					reason:
						"LinkedIn crawling is disabled until explicit permission is confirmed.",
				}
			}

			try {
				const scraped = await config.scraper.readUrl(parsed.normalizedUrl)
				if (!scraped.success || !scraped.markdown) {
					return {
						...parsed,
						status: "failed",
						markdown: null,
						metadata: scraped.metadata,
						reason: "LinkedIn page could not be scraped.",
					}
				}

				return {
					...parsed,
					status: "scraped",
					markdown: scraped.markdown,
					metadata: scraped.metadata,
				}
			} catch (error) {
				config.logger.warn(
					{ url: parsed.normalizedUrl, error },
					"LinkedIn enrichment failed",
				)

				return {
					...parsed,
					status: "failed",
					markdown: null,
					metadata: null,
					reason: error instanceof Error ? error.message : String(error),
				}
			}
		},
	}
}

function parseLinkedInUrl(value: string): ParsedLinkedInUrl | null {
	let parsed: URL
	try {
		parsed = new URL(value)
	} catch {
		return null
	}

	if (!isLinkedInHostname(parsed.hostname)) {
		return null
	}

	const segments = parsed.pathname
		.split("/")
		.map((segment) => segment.trim())
		.filter(Boolean)
	const section = segments[0]?.toLowerCase()
	const publicIdentifier = segments[1] ?? null
	const profileType = section
		? (PROFILE_TYPES[section] ?? "unknown")
		: "unknown"

	const normalizedPath = segments.length > 0 ? `/${segments.join("/")}` : "/"
	const normalizedUrl = `https://www.linkedin.com${normalizedPath}`

	return {
		sourceUrl: value,
		normalizedUrl,
		profileType,
		publicIdentifier,
	}
}

function isLinkedInHostname(hostname: string): boolean {
	const normalized = hostname.toLowerCase()
	return normalized === "linkedin.com" || normalized.endsWith(".linkedin.com")
}

function isSupportedProfileUrl(parsed: ParsedLinkedInUrl): boolean {
	return parsed.profileType !== "unknown" && parsed.publicIdentifier !== null
}

function unsupportedUrlContext(url: string): LinkedInProfileContext {
	return {
		sourceUrl: url,
		normalizedUrl: url,
		profileType: "unknown",
		publicIdentifier: null,
		status: "unsupported_url",
		markdown: null,
		metadata: null,
		reason: "URL is not a supported LinkedIn URL.",
	}
}
