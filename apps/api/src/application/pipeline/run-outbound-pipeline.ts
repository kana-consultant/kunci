import type { Lead } from "#/domain/lead/lead.ts"
import type { BehaviorAnalysis } from "#/domain/behavior-analysis/behavior-analysis.ts"
import type { Logger } from "#/domain/ports/logger.ts"
import type { CreateLeadInput } from "#/domain/lead/lead.ts"
import type { CompanyResearchResult } from "#/application/research/research-company.ts"

interface PipelineDeps {
	captureLead: (input: CreateLeadInput) => Promise<Lead>
	researchCompany: (lead: Lead) => Promise<CompanyResearchResult>
	analyzeBehavior: (lead: Lead, companyProfile: string) => Promise<BehaviorAnalysis>
	sendInitialEmail: (lead: Lead, analysis: BehaviorAnalysis) => Promise<void>
	logger: Logger
}

/**
 * Full pipeline: Capture → Research → Analyze → Generate → Send
 * This is the main orchestrator that runs the complete outbound pipeline.
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
		const lead = await deps.captureLead(input)

		try {
			// Step 2: Research company
			const research = await deps.researchCompany(lead)

			// Step 3: Analyze lead behavior (P1)
			const analysis = await deps.analyzeBehavior(lead, research.companyProfile)

			// Step 4: Generate sequence + Send first email
			await deps.sendInitialEmail(lead, analysis)

			deps.logger.info({ leadId: lead.id }, "Outbound pipeline completed")
			return { leadId: lead.id, status: "email_sent" }
		} catch (error) {
			deps.logger.error(
				{ leadId: lead.id, error },
				"Pipeline failed after capture",
			)
			return { leadId: lead.id, status: "partial_failure" }
		}
	}
}
