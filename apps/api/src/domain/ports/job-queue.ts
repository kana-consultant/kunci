/**
 * Port for asynchronous job processing.
 * Implementation: infrastructure/queue/bullmq-pipeline-queue.ts
 *
 * Kept minimal — we only care about the operations the application layer
 * actually invokes. Worker lifecycle (start/stop, handlers) is wired in the
 * adapter and main.ts, not exposed through this port.
 */
export interface JobQueue {
	/** Enqueue a job to run the outbound pipeline for an already-captured lead. */
	enqueueLeadPipeline(
		params: EnqueueLeadPipelineParams,
	): Promise<{ jobId: string }>

	/** Graceful shutdown — drain in-flight jobs. */
	close(): Promise<void>
}

export interface EnqueueLeadPipelineParams {
	leadId: string
	/** Optional delay in ms (used by the timezone-aware send window). */
	delayMs?: number
	/** Optional priority for ordering — lower = higher priority. */
	priority?: number
}
