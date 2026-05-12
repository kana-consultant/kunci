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
