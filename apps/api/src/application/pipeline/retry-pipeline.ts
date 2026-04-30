import type { CompanyResearchResult } from "#/application/research/research-company.ts"
import type { BehaviorAnalysis } from "#/domain/behavior-analysis/behavior-analysis.ts"
import type { Lead, ReplyStatus } from "#/domain/lead/lead.ts"
import type { Logger } from "#/domain/ports/logger.ts"
import type { PipelineTracker } from "#/domain/ports/pipeline-tracker.ts"

interface RetryPipelineDeps {
	getLeadById: (id: string) => Promise<Lead | null>
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
 * Retry Pipeline: Re-invokes research, analysis, generation, and sending
 * for leads that failed during the initial pipeline run.
 */
export function makeRetryPipelineUseCase(deps: RetryPipelineDeps) {
	return async (leadId: string): Promise<{ status: string }> => {
		const lead = await deps.getLeadById(leadId)
		if (!lead) {
			throw new Error("Lead not found")
		}

		deps.logger.info(
			{ leadId, currentStatus: lead.replyStatus },
			"Retrying outbound pipeline",
		)

		// Update status to researching
		await deps.updateLeadStatus(leadId, "researching")

		try {
			// Step 2: Scrape company website (Step 1 was capture, which succeeded)
			const scrapeStepId = await deps.tracker.startStep(
				lead.id,
				"scrape",
				`[RETRY] Scraping company website: ${lead.companyWebsite}`,
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

			// Step 3 & 4 (Analyze & Build Profile) are part of researchCompany in this implementation

			// Step 6: Analyze lead behavior
			const behaviorStepId = await deps.tracker.startStep(
				lead.id,
				"analyze_behavior",
				"[RETRY] Calling AI Provider: https://openrouter.ai — Behavior Analysis",
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
				"[RETRY] Generating email sequence & sending first email",
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
				"Retry pipeline completed successfully",
			)
			return { status: "success" }
		} catch (error) {
			deps.logger.error({ leadId: lead.id, error }, "Retry pipeline failed")

			// Ensure lead status reflects the failure
			try {
				await deps.updateLeadStatus(lead.id, "research_failed")
			} catch (statusError) {
				deps.logger.error(
					{ leadId: lead.id, statusError },
					"Failed to update lead status after retry failure",
				)
			}

			return { status: "failed" }
		}
	}
}
