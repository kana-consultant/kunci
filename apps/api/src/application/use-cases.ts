import type { EmailSequenceRepository } from "#/domain/email-sequence/email-sequence-repository.ts"
import type { LeadRepository } from "#/domain/lead/lead-repository.ts"
import type { AIService } from "#/domain/ports/ai-service.ts"
import type { Cache } from "#/domain/ports/cache.ts"
import type { EmailService } from "#/domain/ports/email-service.ts"
import type { EmailVerifier } from "#/domain/ports/email-verifier.ts"
import type { Logger } from "#/domain/ports/logger.ts"
import type { PipelineTracker } from "#/domain/ports/pipeline-tracker.ts"
import type { ScraperService } from "#/domain/ports/scraper-service.ts"
import { makeHandleReplyUseCase } from "./email/handle-reply.ts"
import {
	makeSendFollowupUseCase,
	makeSendInitialEmailUseCase,
} from "./email/send-email.ts"
import {
	makeCaptureLeadUseCase,
	makeGetLeadDetailUseCase,
	makeListLeadsUseCase,
} from "./lead/capture-lead.ts"
import { makeRetryPipelineUseCase } from "./pipeline/retry-pipeline.ts"
import { makeRunOutboundPipelineUseCase } from "./pipeline/run-outbound-pipeline.ts"
import { makeResearchCompanyUseCase } from "./research/research-company.ts"
import { makeProcessPendingFollowupsUseCase } from "./scheduler/process-followups.ts"

export interface AppDependencies {
	repos: {
		lead: LeadRepository
		sequence: EmailSequenceRepository
	}
	services: {
		emailVerifier: EmailVerifier
		scraper: ScraperService
		ai: AIService
		email: EmailService
		cache: Cache
	}
	tracker: PipelineTracker
	logger: Logger
}

export function buildUseCases(deps: AppDependencies) {
	const { logger, tracker } = deps

	// Lead use cases
	const captureLead = makeCaptureLeadUseCase({
		leadRepo: deps.repos.lead,
		emailVerifier: deps.services.emailVerifier,
		logger,
	})
	const listLeads = makeListLeadsUseCase({ leadRepo: deps.repos.lead })
	const getLeadDetail = makeGetLeadDetailUseCase({ leadRepo: deps.repos.lead })

	// Research use cases
	const researchCompany = makeResearchCompanyUseCase({
		leadRepo: deps.repos.lead,
		scraper: deps.services.scraper,
		ai: deps.services.ai,
		logger,
	})

	// Email use cases
	const sendInitialEmail = makeSendInitialEmailUseCase({
		leadRepo: deps.repos.lead,
		sequenceRepo: deps.repos.sequence,
		ai: deps.services.ai,
		emailService: deps.services.email,
		logger,
	})

	const sendFollowup = makeSendFollowupUseCase({
		leadRepo: deps.repos.lead,
		sequenceRepo: deps.repos.sequence,
		ai: deps.services.ai,
		emailService: deps.services.email,
		logger,
	})

	const handleReply = makeHandleReplyUseCase({
		leadRepo: deps.repos.lead,
		sequenceRepo: deps.repos.sequence,
		ai: deps.services.ai,
		emailService: deps.services.email,
		logger,
	})

	// Pipeline orchestrator (with step tracking)
	const runOutboundPipeline = makeRunOutboundPipelineUseCase({
		captureLead,
		researchCompany,
		analyzeBehavior: deps.services.ai.analyzeBehavior,
		sendInitialEmail,
		updateLeadStatus: async (id, status) => {
			await deps.repos.lead.update(id, { replyStatus: status })
		},
		tracker,
		logger,
	})
	const retryPipeline = makeRetryPipelineUseCase({
		getLeadById: deps.repos.lead.findById,
		researchCompany,
		analyzeBehavior: deps.services.ai.analyzeBehavior,
		sendInitialEmail,
		updateLeadStatus: async (id, status) => {
			await deps.repos.lead.update(id, { replyStatus: status })
		},
		tracker,
		logger,
	})

	// Scheduler
	const processPendingFollowups = makeProcessPendingFollowupsUseCase({
		leadRepo: deps.repos.lead,
		sendFollowup,
		logger,
	})

	return {
		lead: {
			capture: captureLead,
			list: listLeads,
			getDetail: getLeadDetail,
			getStats: async () => deps.repos.lead.getStats(),
			updateStatus: async (id: string, status: string) => {
				await deps.repos.lead.update(id, { replyStatus: status as any })
			},
		},
		research: {
			company: researchCompany,
		},
		email: {
			sendInitial: sendInitialEmail,
			sendFollowup: sendFollowup,
			handleReply: handleReply,
		},
		pipeline: {
			runOutbound: runOutboundPipeline,
			retry: retryPipeline,
			getSteps: tracker.getStepsForLead,
		},
		scheduler: {
			processPendingFollowups,
		},
	}
}

export type UseCases = ReturnType<typeof buildUseCases>
