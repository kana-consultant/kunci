import { Queue, type RateLimiterOptions, Worker } from "bullmq"
import IORedis, { type Redis } from "ioredis"
import type {
	EnqueueLeadPipelineParams,
	JobQueue,
} from "#/domain/ports/job-queue.ts"
import type { Logger } from "#/domain/ports/logger.ts"

export const PIPELINE_QUEUE_NAME = "lead-pipeline"

interface PipelineJobData {
	leadId: string
}

export type PipelineWorkerHandler = (leadId: string) => Promise<void>

export interface PipelineQueueConfig {
	redisUrl: string
	concurrency: number
	rateLimit: RateLimiterOptions
	logger: Logger
}

export interface PipelineQueueHandle {
	queue: JobQueue
	startWorker(handler: PipelineWorkerHandler): Promise<void>
	stopWorker(): Promise<void>
}

/**
 * Build a BullMQ-backed pipeline queue plus its worker scaffolding.
 *
 * We keep the worker out of `createServerApp` so the HTTP server can boot
 * even when BullMQ workers fail to start (e.g. Redis temporarily unreachable).
 * The `startWorker(handler)` call is the seam where the application layer
 * provides the actual pipeline execution function.
 */
export function createPipelineQueue(
	config: PipelineQueueConfig,
): PipelineQueueHandle {
	// BullMQ requires `maxRetriesPerRequest: null` for blocking commands.
	const connection: Redis = new IORedis(config.redisUrl, {
		maxRetriesPerRequest: null,
	})

	const bullQueue = new Queue<PipelineJobData>(PIPELINE_QUEUE_NAME, {
		connection,
		defaultJobOptions: {
			attempts: 3,
			backoff: { type: "exponential", delay: 30_000 },
			removeOnComplete: { age: 24 * 3600, count: 1000 },
			removeOnFail: { age: 7 * 24 * 3600 },
		},
	})

	let worker: Worker<PipelineJobData> | null = null

	const queue: JobQueue = {
		async enqueueLeadPipeline(params: EnqueueLeadPipelineParams) {
			const job = await bullQueue.add(
				"run-outbound",
				{ leadId: params.leadId },
				{
					delay: params.delayMs,
					priority: params.priority,
					jobId: `lead-${params.leadId}`,
				},
			)
			return { jobId: job.id ?? "" }
		},

		async close() {
			if (worker) {
				await worker.close()
				worker = null
			}
			await bullQueue.close()
			await connection.quit()
		},
	}

	return {
		queue,
		async startWorker(handler: PipelineWorkerHandler) {
			if (worker) return
			worker = new Worker<PipelineJobData>(
				PIPELINE_QUEUE_NAME,
				async (job) => {
					await handler(job.data.leadId)
				},
				{
					connection,
					concurrency: config.concurrency,
					limiter: config.rateLimit,
				},
			)

			worker.on("failed", (job, err) => {
				config.logger.error(
					{ jobId: job?.id, leadId: job?.data.leadId, err },
					"Pipeline job failed",
				)
			})
			worker.on("completed", (job) => {
				config.logger.info(
					{ jobId: job.id, leadId: job.data.leadId },
					"Pipeline job completed",
				)
			})

			await worker.waitUntilReady()
			config.logger.info(
				{ concurrency: config.concurrency, rateLimit: config.rateLimit },
				"Pipeline worker started",
			)
		},
		async stopWorker() {
			if (!worker) return
			await worker.close()
			worker = null
		},
	}
}
