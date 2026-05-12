import type { EmailMessageRepository } from "#/domain/email-message/email-message-repository.ts"
import type { EmailSequenceRepository } from "#/domain/email-sequence/email-sequence-repository.ts"
import { isReplyStatus, type ReplyStatus } from "#/domain/lead/lead.ts"
import type { LeadRepository } from "#/domain/lead/lead-repository.ts"
import type { OptOutRepository } from "#/domain/opt-out/opt-out-repository.ts"
import type { AIService } from "#/domain/ports/ai-service.ts"
import type { Cache } from "#/domain/ports/cache.ts"
import type { EmailService } from "#/domain/ports/email-service.ts"
import type { EmailVerifier } from "#/domain/ports/email-verifier.ts"
import type { InboundMailbox } from "#/domain/ports/inbound-mailbox.ts"
import type { JobQueue } from "#/domain/ports/job-queue.ts"
import type { LinkedInService } from "#/domain/ports/linkedin-service.ts"
import type { Logger } from "#/domain/ports/logger.ts"
import type { NotificationService } from "#/domain/ports/notification-service.ts"
import type { PipelineTracker } from "#/domain/ports/pipeline-tracker.ts"
import type { ScraperService } from "#/domain/ports/scraper-service.ts"
import { makeHandleReplyUseCase } from "./email/handle-reply.ts"
import { makePollInboundMailboxUseCase } from "./email/poll-inbound-mailbox.ts"
import {
	makeSendFollowupUseCase,
	makeSendInitialEmailUseCase,
	type SendEmailConfig,
} from "./email/send-email.ts"
import {
	makeCheckOptOutUseCase,
	makeGetOptOutByTokenUseCase,
	makeRegisterOptOutUseCase,
	makeUnsubscribeByTokenUseCase,
	makeUnsubscribeUrlBuilder,
	type UnsubscribeConfig,
} from "./email/unsubscribe.ts"
import { makeBulkCaptureLeadUseCase } from "./lead/bulk-capture-lead.ts"
import {
	makeCaptureLeadUseCase,
	makeGetLeadDetailUseCase,
	makeListLeadsUseCase,
} from "./lead/capture-lead.ts"
import { makeEnrichLeadUseCase } from "./lead/enrich-lead.ts"
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
		optOut: OptOutRepository
	}
	services: {
		emailVerifier: EmailVerifier
		scraper: ScraperService
		linkedin: LinkedInService
		ai: AIService
		email: EmailService
		cache: Cache
		settings: SettingsService
		notifier: NotificationService
	}
	tracker: PipelineTracker
	logger: Logger
	jobQueue: JobQueue
	/** Optional — when provided, exposes pollInbound() use case. */
	inboundMailbox?: InboundMailbox
	config: {
		unsubscribe: UnsubscribeConfig
		sendEmail: SendEmailConfig
	}
}

export function buildUseCases(deps: AppDependencies) {
	const { logger, tracker } = deps

	// Unsubscribe / opt-out
	const buildUnsubscribeUrl = makeUnsubscribeUrlBuilder({
		config: deps.config.unsubscribe,
	})
	const unsubscribeByToken = makeUnsubscribeByTokenUseCase({
		leadRepo: deps.repos.lead,
		optOutRepo: deps.repos.optOut,
		logger,
		config: deps.config.unsubscribe,
	})
	const registerOptOut = makeRegisterOptOutUseCase({
		leadRepo: deps.repos.lead,
		optOutRepo: deps.repos.optOut,
		logger,
		config: deps.config.unsubscribe,
	})
	const checkOptOut = makeCheckOptOutUseCase({ optOutRepo: deps.repos.optOut })
	const getOptOutByToken = makeGetOptOutByTokenUseCase({
		leadRepo: deps.repos.lead,
		optOutRepo: deps.repos.optOut,
		logger,
		config: deps.config.unsubscribe,
	})

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
		optOutRepo: deps.repos.optOut,
		logger,
	})
	const listLeads = makeListLeadsUseCase({ leadRepo: deps.repos.lead })
	const getLeadDetail = makeGetLeadDetailUseCase({ leadRepo: deps.repos.lead })

	// Research use cases
	const researchCompany = makeResearchCompanyUseCase({
		leadRepo: deps.repos.lead,
		scraper: deps.services.scraper,
		linkedin: deps.services.linkedin,
		ai: deps.services.ai,
		logger,
	})

	const enrichLead = makeEnrichLeadUseCase({
		leadRepo: deps.repos.lead,
		scraper: deps.services.scraper,
		ai: deps.services.ai,
		logger,
	})

	// Email use cases
	const sendInitialEmail = makeSendInitialEmailUseCase({
		leadRepo: deps.repos.lead,
		sequenceRepo: deps.repos.sequence,
		optOutRepo: deps.repos.optOut,
		ai: deps.services.ai,
		emailService: deps.services.email,
		logger,
		buildUnsubscribeUrl,
		config: deps.config.sendEmail,
	})

	const sendFollowup = makeSendFollowupUseCase({
		leadRepo: deps.repos.lead,
		sequenceRepo: deps.repos.sequence,
		optOutRepo: deps.repos.optOut,
		ai: deps.services.ai,
		emailService: deps.services.email,
		logger,
		buildUnsubscribeUrl,
		config: deps.config.sendEmail,
	})

	const handleReply = makeHandleReplyUseCase({
		leadRepo: deps.repos.lead,
		messageRepo: deps.repos.message,
		ai: deps.services.ai,
		emailService: deps.services.email,
		settings: deps.services.settings,
		notifier: deps.services.notifier,
		logger,
		registerOptOut,
	})

	const pollInboundMailbox = deps.inboundMailbox
		? makePollInboundMailboxUseCase({
				mailbox: deps.inboundMailbox,
				handleReply,
				logger,
			})
		: null

	// Pipeline orchestrator (with step tracking)
	const runOutboundPipeline = makeRunOutboundPipelineUseCase({
		captureLead,
		enrichLead,
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
		enrichLead,
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
		settings: deps.services.settings,
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
		enrich: enrichLead,
		email: {
			sendInitial: sendInitialEmail,
			sendFollowup: sendFollowup,
			handleReply: handleReply,
			pollInbound: pollInboundMailbox,
		},
		optOut: {
			unsubscribeByToken,
			register: registerOptOut,
			check: checkOptOut,
			getByToken: getOptOutByToken,
			buildUrl: buildUnsubscribeUrl,
		},
		pipeline: {
			runOutbound: runOutboundPipeline,
			runOutboundForExistingLead,
			retry: retryPipeline,
			getSteps: tracker.getStepsForLead,
			enqueue: (
				leadId: string,
				opts?: { delayMs?: number; priority?: number },
			) =>
				deps.jobQueue.enqueueLeadPipeline({
					leadId,
					delayMs: opts?.delayMs,
					priority: opts?.priority,
				}),
		},
		scheduler: {
			processPendingFollowups,
		},
		settings: deps.services.settings,
		scraper: deps.services.scraper,
	}
}

export type UseCases = ReturnType<typeof buildUseCases>
