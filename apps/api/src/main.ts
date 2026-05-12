import { serve } from "@hono/node-server"
import { createServerApp } from "./app.ts"
import { env } from "./infrastructure/config/env.ts"
import { logger } from "./infrastructure/observability/logger.ts"
import { startScheduler } from "./infrastructure/scheduler/cron.ts"

async function bootstrap() {
	const { app, useCases } = await createServerApp()

	await startScheduler(useCases)

	serve(
		{
			fetch: app.fetch,
			port: env.PORT,
		},
		(info) => {
			logger.info(`Server listening on http://localhost:${info.port}`)
		},
	)
}

bootstrap().catch((error) => {
	logger.fatal({ error }, "Failed to start server")
	process.exit(1)
})
