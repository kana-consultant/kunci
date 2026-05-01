import type { CompanyResearchResult } from "#/application/research/research-company.ts"
import type { BehaviorAnalysis } from "#/domain/behavior-analysis/behavior-analysis.ts"
import type { CreateLeadInput, Lead, ReplyStatus } from "#/domain/lead/lead.ts"
import type { Logger } from "#/domain/ports/logger.ts"
import type { PipelineTracker } from "#/domain/ports/pipeline-tracker.ts"

interface PipelineDeps {
	captureLead: (input: CreateLeadInput) => Promise<Lead>
	researchCompany: (lead: Lead) => Promise<CompanyResearchResult>
	analyzeBehavior: (
		lead: Lead,
		companyProfile: string,
	) => Promise<BehaviorAnalysis>
	sendInitialEmail: (lead: Lead, analysis: BehaviorAnalysis) => Promise<void>
	updateLeadStatus: (leadId: string, status: ReplyStatus) => Promise<void>
	tracker: PipelineTracker
	logger: Logger
}

/**
 * Full pipeline: Capture → Research → Analyze → Generate → Send
 * This is the main orchestrator that runs the complete outbound pipeline.
 * Every step is tracked with timestamps, durations, and detail context.
 */
export function makeRunOutboundPipelineUseCase(deps: PipelineDeps) {
	return async (input: {
		fullName: string
		email: string
		companyName: string
		companyWebsite: string
		painPoints?: string
		leadSource?: string
	}): Promise<{ leadId: string; status: string }> => {
		deps.logger.info({ email: input.email }, "Starting outbound pipeline")

		// Step 1: Capture lead
		const captureStepId = await deps.tracker.startStep(
			null, // lead not created yet
			"capture",
			`Capturing lead: ${input.fullName} (${input.email})`,
			{ company: input.companyName },
		)

		let lead: Lead
		try {
			lead = await deps.captureLead(input)
			await deps.tracker.completeStep(captureStepId, {
				leadId: lead.id,
				email: lead.email,
			})
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error)
			await deps.tracker.failStep(captureStepId, msg)
			throw error
		}

		try {
			// Step 2: Scrape company website
			const scrapeStepId = await deps.tracker.startStep(
				lead.id,
				"scrape",
				`Scraping company website: ${lead.companyWebsite}`,
				{ url: lead.companyWebsite, provider: "Deepcrawl" },
			)

			// Step 3: AI Analyze website (P3)
			let research: CompanyResearchResult
			try {
				research = await deps.researchCompany(lead)
				await deps.tracker.completeStep(scrapeStepId, {
					url: lead.companyWebsite,
					hasMarkdown: !!research.rawMarkdown,
				})
			} catch (error) {
				const msg = error instanceof Error ? error.message : String(error)
				await deps.tracker.failStep(scrapeStepId, msg, {
					url: lead.companyWebsite,
				})
				throw error
			}

			// Step 4: AI Analyze website content (inside researchCompany)
			const aiAnalyzeStepId = await deps.tracker.startStep(
				lead.id,
				"analyze_website",
				"Calling AI Provider: https://openrouter.ai — Website Analysis",
				{
					provider: "OpenRouter",
					model: "openai/o3-mini",
					apiUrl: "https://openrouter.ai/api/v1/chat/completions",
				},
			)
			await deps.tracker.completeStep(aiAnalyzeStepId, {
				brandName: research.websiteAnalysis.brandName,
				industry: research.websiteAnalysis.industryCategory,
			})

			// Step 5: AI Build company profile (inside researchCompany)
			const profileStepId = await deps.tracker.startStep(
				lead.id,
				"build_profile",
				"Calling AI Provider: https://openrouter.ai — Company Profiler",
				{
					provider: "OpenRouter",
					model: "openai/gpt-4.1-mini",
					apiUrl: "https://openrouter.ai/api/v1/chat/completions",
				},
			)
			await deps.tracker.completeStep(profileStepId, {
				profileLength: research.companyProfile.length,
			})

			// Step 6: Analyze lead behavior (P1)
			const behaviorStepId = await deps.tracker.startStep(
				lead.id,
				"analyze_behavior",
				"Calling AI Provider: https://openrouter.ai — Behavior Analysis",
				{
					provider: "OpenRouter",
					model: "openai/gpt-4o",
					apiUrl: "https://openrouter.ai/api/v1/chat/completions",
				},
			)

			let analysis: BehaviorAnalysis
			try {
				analysis = await deps.analyzeBehavior(lead, research.companyProfile)
				await deps.tracker.completeStep(behaviorStepId, {
					conversionProbability: analysis.conversionProbability,
					journeyStage: analysis.journeyStage,
				})
			} catch (error) {
				const msg = error instanceof Error ? error.message : String(error)
				await deps.tracker.failStep(behaviorStepId, msg)
				throw error
			}

			// Step 7: Generate sequence + Send first email
			const sendStepId = await deps.tracker.startStep(
				lead.id,
				"send_email",
				"Generating email sequence & sending first email",
				{ provider: "OpenRouter + Resend" },
			)

			try {
				await deps.sendInitialEmail(lead, analysis)
				await deps.tracker.completeStep(sendStepId)
			} catch (error) {
				const msg = error instanceof Error ? error.message : String(error)
				await deps.tracker.failStep(sendStepId, msg)
				throw error
			}

			deps.logger.info({ leadId: lead.id }, "Outbound pipeline completed")
			return { leadId: lead.id, status: "email_sent" }
		} catch (error) {
			deps.logger.error(
				{ leadId: lead.id, error },
				"Pipeline failed after capture",
			)

			// Ensure lead status reflects the failure — don't leave it stuck in "researching"
			try {
				await deps.updateLeadStatus(lead.id, "research_failed")
			} catch (statusError) {
				deps.logger.error(
					{ leadId: lead.id, statusError },
					"Failed to update lead status after pipeline failure",
				)
			}

			return { leadId: lead.id, status: "partial_failure" }
		}
	}
}

/**
 * Background pipeline: Research → Analyze → Generate → Send
 * Used when the lead has already been captured (e.g., from the capture route).
 * Runs the heavy AI steps without blocking the HTTP response.
 */
export function makeRunOutboundForExistingLeadUseCase(
	deps: Omit<PipelineDeps, "captureLead">,
) {
	return async (lead: Lead): Promise<{ leadId: string; status: string }> => {
		deps.logger.info(
			{ leadId: lead.id, email: lead.email },
			"Starting background outbound pipeline",
		)

		try {
			// Step 1: Scrape company website
			const scrapeStepId = await deps.tracker.startStep(
				lead.id,
				"scrape",
				`Scraping company website: ${lead.companyWebsite}`,
				{ url: lead.companyWebsite, provider: "Deepcrawl" },
			)

			let research: CompanyResearchResult
			try {
				research = await deps.researchCompany(lead)
				await deps.tracker.completeStep(scrapeStepId, {
					url: lead.companyWebsite,
					hasMarkdown: !!research.rawMarkdown,
				})
			} catch (error) {
				const msg = error instanceof Error ? error.message : String(error)
				await deps.tracker.failStep(scrapeStepId, msg, {
					url: lead.companyWebsite,
				})
				throw error
			}

			// Step 2: AI Analyze website content
			const aiAnalyzeStepId = await deps.tracker.startStep(
				lead.id,
				"analyze_website",
				"Calling AI Provider: https://openrouter.ai — Website Analysis",
				{
					provider: "OpenRouter",
					model: "openai/o3-mini",
					apiUrl: "https://openrouter.ai/api/v1/chat/completions",
				},
			)
			await deps.tracker.completeStep(aiAnalyzeStepId, {
				brandName: research.websiteAnalysis.brandName,
				industry: research.websiteAnalysis.industryCategory,
			})

			// Step 3: AI Build company profile
			const profileStepId = await deps.tracker.startStep(
				lead.id,
				"build_profile",
				"Calling AI Provider: https://openrouter.ai — Company Profiler",
				{
					provider: "OpenRouter",
					model: "openai/gpt-4.1-mini",
					apiUrl: "https://openrouter.ai/api/v1/chat/completions",
				},
			)
			await deps.tracker.completeStep(profileStepId, {
				profileLength: research.companyProfile.length,
			})

			// Step 4: Analyze lead behavior
			const behaviorStepId = await deps.tracker.startStep(
				lead.id,
				"analyze_behavior",
				"Calling AI Provider: https://openrouter.ai — Behavior Analysis",
				{
					provider: "OpenRouter",
					model: "openai/gpt-4o",
					apiUrl: "https://openrouter.ai/api/v1/chat/completions",
				},
			)

			let analysis: BehaviorAnalysis
			try {
				analysis = await deps.analyzeBehavior(lead, research.companyProfile)
				await deps.tracker.completeStep(behaviorStepId, {
					conversionProbability: analysis.conversionProbability,
					journeyStage: analysis.journeyStage,
				})
			} catch (error) {
				const msg = error instanceof Error ? error.message : String(error)
				await deps.tracker.failStep(behaviorStepId, msg)
				throw error
			}

			// Step 5: Generate sequence + Send first email
			const sendStepId = await deps.tracker.startStep(
				lead.id,
				"send_email",
				"Generating email sequence & sending first email",
				{ provider: "OpenRouter + Resend" },
			)

			try {
				await deps.sendInitialEmail(lead, analysis)
				await deps.tracker.completeStep(sendStepId)
			} catch (error) {
				const msg = error instanceof Error ? error.message : String(error)
				await deps.tracker.failStep(sendStepId, msg)
				throw error
			}

			deps.logger.info(
				{ leadId: lead.id },
				"Background outbound pipeline completed",
			)
			return { leadId: lead.id, status: "email_sent" }
		} catch (error) {
			deps.logger.error(
				{ leadId: lead.id, error },
				"Background pipeline failed",
			)

			try {
				await deps.updateLeadStatus(lead.id, "research_failed")
			} catch (statusError) {
				deps.logger.error(
					{ leadId: lead.id, statusError },
					"Failed to update lead status after pipeline failure",
				)
			}

			return { leadId: lead.id, status: "partial_failure" }
		}
	}
}
