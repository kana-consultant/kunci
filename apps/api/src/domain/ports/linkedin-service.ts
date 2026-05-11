export type LinkedInProfileType = "member" | "company" | "school" | "unknown"

export type LinkedInEnrichmentStatus =
	| "url_only"
	| "scraped"
	| "failed"
	| "unsupported_url"

export interface LinkedInProfileContext {
	sourceUrl: string
	normalizedUrl: string
	profileType: LinkedInProfileType
	publicIdentifier: string | null
	status: LinkedInEnrichmentStatus
	markdown: string | null
	metadata: {
		title?: string
		description?: string
	} | null
	reason?: string
}

export interface LinkedInService {
	enrichProfile(
		url: string | null | undefined,
	): Promise<LinkedInProfileContext | null>
}
