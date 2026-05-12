import { serve } from "@hono/node-server"
import { createServerApp } from "./app.ts"
import { env } from "./infrastructure/config/env.ts"
import { logger } from "./infrastructure/observability/logger.ts"
import { startScheduler } from "./infrastructure/scheduler/cron.ts"

async function bootstrap() {
	const { app, useCases, queueHandle } = await createServerApp()

	await startScheduler(useCases)

	// Start the BullMQ worker — the handler loads the fresh lead state from
	// the repository and runs the existing-lead pipeline. The worker only
	// starts once the HTTP app is built so DI is fully wired.
	await queueHandle.startWorker(async (leadId) => {
		const lead = await useCases.lead.getDetail(leadId)
		await useCases.pipeline.runOutboundForExistingLead(lead)
	})

	// IMAP polling fallback for inbound replies (when Resend Inbound MX
	// isn't configured for the sender domain). Runs at IMAP_POLL_INTERVAL_SECONDS.
	const inboundPoll = useCases.email.pollInbound
	let inboundTimer: NodeJS.Timeout | null = null
	let inboundRunning = false
	if (inboundPoll) {
		const intervalMs = env.IMAP_POLL_INTERVAL_SECONDS * 1000
		const tick = async () => {
			if (inboundRunning) return
			inboundRunning = true
			try {
				await inboundPoll()
			} catch (err) {
				logger.error({ err }, "Inbound mailbox poll failed")
			} finally {
				inboundRunning = false
			}
		}
		inboundTimer = setInterval(tick, intervalMs)
		void tick()
		logger.info(
			{ intervalSeconds: env.IMAP_POLL_INTERVAL_SECONDS, user: env.IMAP_USER },
			"IMAP inbound poller started",
		)
	}

	const server = serve(
		{
			fetch: app.fetch,
			port: env.PORT,
		},
		(info) => {
			logger.info(`Server listening on http://localhost:${info.port}`)
		},
	)

	const shutdown = async (signal: string) => {
		logger.info({ signal }, "Shutting down")
		if (inboundTimer) clearInterval(inboundTimer)
		try {
			await queueHandle.stopWorker()
		} catch (err) {
			logger.warn({ err }, "Worker shutdown failed")
		}
		server.close()
		process.exit(0)
	}
	process.on("SIGINT", () => void shutdown("SIGINT"))
	process.on("SIGTERM", () => void shutdown("SIGTERM"))
}

bootstrap().catch((error) => {
	logger.fatal({ error }, "Failed to start server")
	process.exit(1)
})
