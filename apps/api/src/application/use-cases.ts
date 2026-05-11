import type { EmailMessageRepository } from "#/domain/email-message/email-message-repository.ts"
import type { EmailSequenceRepository } from "#/domain/email-sequence/email-sequence-repository.ts"
import { isReplyStatus, type ReplyStatus } from "#/domain/lead/lead.ts"
import type { LeadRepository } from "#/domain/lead/lead-repository.ts"
import type { AIService } from "#/domain/ports/ai-service.ts"
import type { Cache } from "#/domain/ports/cache.ts"
import type { EmailService } from "#/domain/ports/email-service.ts"
import type { EmailVerifier } from "#/domain/ports/email-verifier.ts"
import type { Logger } from "#/domain/ports/logger.ts"
import type { NotificationService } from "#/domain/ports/notification-service.ts"
import type { PipelineTracker } from "#/domain/ports/pipeline-tracker.ts"
import type { ScraperService } from "#/domain/ports/scraper-service.ts"
import { makeHandleReplyUseCase } from "./email/handle-reply.ts"
import {
	makeSendFollowupUseCase,
	makeSendInitialEmailUseCase,
} from "./email/send-email.ts"
import { makeBulkCaptureLeadUseCase } from "./lead/bulk-capture-lead.ts"
import {
	makeCaptureLeadUseCase,
	makeGetLeadDetailUseCase,
	makeListLeadsUseCase,
} from "./lead/capture-lead.ts"
import { makeRetryPipelineUseCase } from "./pipeline/retry-pipeline.ts"
import {
	makeRunOutboundForExistingLeadUseCase,
	makeRunOutboundPipelineUseCase,
} from "./pipeline/run-outbound-pipeline.ts"
import { makeResearchCompanyUseCase } from "./research/research-company.ts"
import { makeProcessPendingFollowupsUseCase } from "./scheduler/process-followups.ts"
import type { SettingsService } from "./shared/settings-service.ts"

export interface AppDependencies {
	repos: {
		lead: LeadRepository
		sequence: EmailSequenceRepository
		message: EmailMessageRepository
	}
	services: {
		emailVerifier: EmailVerifier
		scraper: ScraperService
		ai: AIService
		email: EmailService
		cache: Cache
		settings: SettingsService
		notifier: NotificationService
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
		notifier: deps.services.notifier,
	})
	const bulkCaptureLead = makeBulkCaptureLeadUseCase({
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
		messageRepo: deps.repos.message,
		ai: deps.services.ai,
		emailService: deps.services.email,
		settings: deps.services.settings,
		notifier: deps.services.notifier,
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
		notifier: deps.services.notifier,
	})
	const runOutboundForExistingLead = makeRunOutboundForExistingLeadUseCase({
		researchCompany,
		analyzeBehavior: deps.services.ai.analyzeBehavior,
		sendInitialEmail,
		updateLeadStatus: async (id, status) => {
			await deps.repos.lead.update(id, { replyStatus: status })
		},
		tracker,
		logger,
		notifier: deps.services.notifier,
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
			bulkCapture: bulkCaptureLead,
			list: listLeads,
			getDetail: getLeadDetail,
			getStats: async (period?: "7d" | "30d" | "all") =>
				deps.repos.lead.getStats(period),
			getStageDistribution: async (period?: "7d" | "30d" | "all") =>
				deps.repos.lead.getStageDistribution(period),
			getRecentActivity: async (limit: number) =>
				deps.tracker.getRecentActivity(limit),
			updateStatus: async (id: string, status: ReplyStatus) => {
				if (!isReplyStatus(status)) {
					throw new Error(`Invalid replyStatus: ${status}`)
				}
				await deps.repos.lead.update(id, { replyStatus: status })
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
			runOutboundForExistingLead,
			retry: retryPipeline,
			getSteps: tracker.getStepsForLead,
		},
		scheduler: {
			processPendingFollowups,
		},
		settings: deps.services.settings,
		scraper: deps.services.scraper,
	}
}

export type UseCases = ReturnType<typeof buildUseCases>
