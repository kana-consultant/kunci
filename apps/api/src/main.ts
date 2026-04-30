import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import { onError } from "@orpc/server"
import { RPCHandler } from "@orpc/server/fetch"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { requestId } from "hono/request-id"
import { z } from "zod"

const __dirname = dirname(fileURLToPath(import.meta.url))

function readAppVersion(): string {
	// Try root package.json relative to source file location
	const candidates = [
		resolve(__dirname, "../../../package.json"), // from src/ or dist/
		resolve(process.cwd(), "package.json"), // from monorepo root
	]
	for (const candidate of candidates) {
		try {
			const pkg = JSON.parse(readFileSync(candidate, "utf-8"))
			if (pkg.version) return pkg.version
		} catch {
			/* try next */
		}
	}
	return "unknown"
}

const APP_VERSION = readAppVersion()

import { buildUseCases } from "./application/use-cases.ts"
import { createOpenRouterService } from "./infrastructure/ai/openrouter-service.ts"
import { auth } from "./infrastructure/auth/better-auth.ts"
import { createRedisCache } from "./infrastructure/cache/redis.ts"
import { env } from "./infrastructure/config/env.ts"
import { createDb } from "./infrastructure/db/client.ts"
import { createEmailSequenceRepository } from "./infrastructure/db/repositories/email-sequence-repository.ts"
import { createLeadRepository } from "./infrastructure/db/repositories/lead-repository.ts"
import { createPipelineStepRepository } from "./infrastructure/db/repositories/pipeline-step-repository.ts"
import { createResendService } from "./infrastructure/email/resend-service.ts"
import { createMxVerifier } from "./infrastructure/email-verification/mx-verifier.ts"
import { logger } from "./infrastructure/observability/logger.ts"
import { startScheduler } from "./infrastructure/scheduler/cron.ts"
import { createDeepcrawlService } from "./infrastructure/scraper/deepcrawl-service.ts"
import { appRouter } from "./presentation/routers/index.ts"

async function bootstrap() {
	logger.info({ version: APP_VERSION }, "Starting KUNCI API Server...")

	// 1. Initialize Infrastructure
	const db = createDb(env.DATABASE_URL)
	const cache = createRedisCache(env.REDIS_URL)

	const repos = {
		lead: createLeadRepository(db),
		sequence: createEmailSequenceRepository(db),
	}

	const services = {
		emailVerifier: createMxVerifier(),
		scraper: createDeepcrawlService({ apiKey: env.DEEPCRAWL_API_KEY }),
		ai: createOpenRouterService({ apiKey: env.OPENROUTER_API_KEY }),
		email: createResendService({
			apiKey: env.RESEND_API_KEY,
			senderEmail: env.SENDER_EMAIL,
			senderName: env.SENDER_NAME,
		}),
		cache,
	}

	const tracker = createPipelineStepRepository(db)

	// 2. Build Application Use Cases
	const useCases = buildUseCases({ repos, services, tracker, logger })

	// 3. Setup oRPC
	const rpcHandler = new RPCHandler(appRouter, {
		interceptors: [onError((error) => logger.error({ error }, "oRPC Error"))],
	})

	// 4. Setup Hono App
	const app = new Hono()

	app.use("*", requestId())
	app.use(
		"*",
		cors({
			origin: (origin) =>
				origin?.startsWith("http://localhost") ? origin : env.WEB_ORIGIN,
			credentials: true,
		}),
	)

	// Logging middleware
	app.use("*", async (c, next) => {
		const start = Date.now()
		await next()
		logger.info(
			{
				method: c.req.method,
				url: c.req.url,
				status: c.res.status,
				durationMs: Date.now() - start,
			},
			"HTTP Request",
		)
	})

	// Auth
	app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw))

	const ResendWebhookSchema = z
		.object({
			type: z.string(),
			data: z
				.object({
					from: z.string().optional(),
					subject: z.string().optional(),
					text: z.string().optional(),
					html: z.string().optional(),
					message_id: z.string().optional(),
					email_id: z.string().optional(),
				})
				.passthrough(),
		})
		.passthrough()

	// Health checks
	app.get("/healthz", (c) => c.json({ status: "ok", version: APP_VERSION }))
	app.get("/ready", async (c) => {
		const redisOk = await cache.ping()
		return c.json({ redis: redisOk })
	})

	// Webhooks
	app.post("/webhooks/resend", async (c) => {
		try {
			// 1. Get RAW TEXT for verification
			const payload = await c.req.text()
			const webhookSecret = env.RESEND_WEBHOOK_SECRET

			let event: any;

			if (webhookSecret) {
				const svixId = c.req.header("svix-id")
				const svixTimestamp = c.req.header("svix-timestamp")
				const svixSignature = c.req.header("svix-signature")

				if (!svixId || !svixTimestamp || !svixSignature) {
					logger.warn("Missing svix webhook headers")
					return c.json({ error: "Missing webhook signature" }, 401)
				}

				// 2. Use SDK verification function
				try {
					event = services.email.verifyWebhook(payload, {
						"svix-id": svixId,
						"svix-timestamp": svixTimestamp,
						"svix-signature": svixSignature
					}, webhookSecret);
				} catch (err) {
					logger.warn("Invalid webhook signature")
					return c.json({ error: "Invalid signature" }, 401)
				}
			} else {
				event = JSON.parse(payload);
			}

			const parsedEvent = ResendWebhookSchema.parse(event)
			logger.info({ type: parsedEvent.type }, "Received Resend Webhook")

			if (parsedEvent.type === "email.received" || parsedEvent.type === "email.replied") {
				const emailId = parsedEvent.data.email_id

				if (parsedEvent.type === "email.received" && emailId) {
					// Fire and forget to return 200 OK fast
					;(async () => {
						try {
							const receivedEmail = await services.email.getReceivedEmail(emailId)
							await useCases.email.handleReply({
								fromEmail: receivedEmail.fromEmail,
								subject: receivedEmail.subject,
								textBody: receivedEmail.textBody,
								messageId: receivedEmail.messageId,
							})
						} catch (err) {
							logger.error({ err, emailId }, "Background reply handling failed")
						}
					})()
				} else if (parsedEvent.data.from) {
					// Fallback for cases where data is already present in the payload (e.g. email.replied)
					useCases.email
						.handleReply({
							fromEmail: parsedEvent.data.from,
							subject: parsedEvent.data.subject || "No Subject",
							textBody: parsedEvent.data.text || parsedEvent.data.html || "No body",
							messageId: parsedEvent.data.message_id || "",
						})
						.catch((err) =>
							logger.error({ err }, "Background reply handling failed"),
						)
				}
			}

			return c.json({ received: true })
		} catch (error) {
			logger.error({ error }, "Failed to process webhook")
			return c.json({ error: "Invalid webhook payload" }, 400)
		}
	})

	// Mount oRPC
	app.all("/rpc/*", async (c, next) => {
		const { matched, response } = await rpcHandler.handle(c.req.raw, {
			prefix: "/rpc",
			context: {
				headers: c.req.raw.headers,
				session: null, // Populated in protectedProcedure middleware
				useCases,
			},
		})
		if (matched) return c.newResponse(response.body, response)
		await next()
	})

	// 5. Serve Static Frontend if WEB_DIST_PATH is configured
	if (env.WEB_DIST_PATH) {
		app.use("/*", serveStatic({ root: env.WEB_DIST_PATH }))

		// SPA Fallback for unknown routes
		app.notFound((c) => {
			if (
				!c.req.path.startsWith("/rpc") &&
				!c.req.path.startsWith("/webhooks")
			) {
				try {
					const html = readFileSync(
						resolve(env.WEB_DIST_PATH!, "index.html"),
						"utf-8",
					)
					return c.html(html)
				} catch (_e) {
					return c.json({ error: "Frontend build not found" }, 404)
				}
			}
			return c.json({ error: "Not found" }, 404)
		})
	} else {
		app.notFound((c) => c.json({ error: "Not found" }, 404))
	}

	// 5. Start Scheduler (Cron)
	startScheduler(useCases)

	// 6. Start Server
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
