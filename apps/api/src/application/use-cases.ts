import type { LeadRepository } from "#/domain/lead/lead-repository.ts"
import type { EmailSequenceRepository } from "#/domain/email-sequence/email-sequence-repository.ts"
import type { EmailVerifier } from "#/domain/ports/email-verifier.ts"
import type { ScraperService } from "#/domain/ports/scraper-service.ts"
import type { AIService } from "#/domain/ports/ai-service.ts"
import type { EmailService } from "#/domain/ports/email-service.ts"
import type { Cache } from "#/domain/ports/cache.ts"

import {
	makeCaptureLeadUseCase,
	makeListLeadsUseCase,
	makeGetLeadDetailUseCase,
} from "./lead/capture-lead.ts"
import { makeResearchCompanyUseCase } from "./research/research-company.ts"
import {
	makeSendInitialEmailUseCase,
	makeSendFollowupUseCase,
} from "./email/send-email.ts"
import { makeHandleReplyUseCase } from "./email/handle-reply.ts"
import { makeProcessPendingFollowupsUseCase } from "./scheduler/process-followups.ts"
import { makeRunOutboundPipelineUseCase } from "./pipeline/run-outbound-pipeline.ts"

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
}

export function buildUseCases(deps: AppDependencies) {
	// Lead use cases
	const captureLead = makeCaptureLeadUseCase({
		leadRepo: deps.repos.lead,
		emailVerifier: deps.services.emailVerifier,
	})
	const listLeads = makeListLeadsUseCase({ leadRepo: deps.repos.lead })
	const getLeadDetail = makeGetLeadDetailUseCase({ leadRepo: deps.repos.lead })

	// Research use cases
	const researchCompany = makeResearchCompanyUseCase({
		leadRepo: deps.repos.lead,
		scraper: deps.services.scraper,
		ai: deps.services.ai,
	})

	// Email use cases
	const sendInitialEmail = makeSendInitialEmailUseCase({
		leadRepo: deps.repos.lead,
		sequenceRepo: deps.repos.sequence,
		ai: deps.services.ai,
		emailService: deps.services.email,
	})

	const sendFollowup = makeSendFollowupUseCase({
		leadRepo: deps.repos.lead,
		sequenceRepo: deps.repos.sequence,
		ai: deps.services.ai,
		emailService: deps.services.email,
	})

	const handleReply = makeHandleReplyUseCase({
		leadRepo: deps.repos.lead,
		sequenceRepo: deps.repos.sequence,
		ai: deps.services.ai,
		emailService: deps.services.email,
	})

	// Pipeline orchestrator
	const runOutboundPipeline = makeRunOutboundPipelineUseCase({
		captureLead,
		researchCompany,
		analyzeBehavior: deps.services.ai.analyzeBehavior,
		sendInitialEmail,
	})

	// Scheduler
	const processPendingFollowups = makeProcessPendingFollowupsUseCase({
		leadRepo: deps.repos.lead,
		sendFollowup,
	})

	return {
		lead: {
			capture: captureLead,
			list: listLeads,
			getDetail: getLeadDetail,
			getStats: async () => deps.repos.lead.getStats(),
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
		},
		scheduler: {
			processPendingFollowups,
		},
	}
}

export type UseCases = ReturnType<typeof buildUseCases>
