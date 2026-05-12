import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { serveStatic } from "@hono/node-server/serve-static"
import { onError } from "@orpc/server"
import { RPCHandler } from "@orpc/server/fetch"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { requestId } from "hono/request-id"
import { z } from "zod"
import { SettingsService } from "./application/shared/settings-service.ts"
import { buildUseCases } from "./application/use-cases.ts"
import { createOpenRouterService } from "./infrastructure/ai/openrouter-service.ts"
import { auth } from "./infrastructure/auth/better-auth.ts"
import { createRedisCache } from "./infrastructure/cache/redis.ts"
import { env } from "./infrastructure/config/env.ts"
import { createDb } from "./infrastructure/db/client.ts"
import { createEmailMessageRepository } from "./infrastructure/db/repositories/email-message-repository.ts"
import { createEmailSequenceRepository } from "./infrastructure/db/repositories/email-sequence-repository.ts"
import { createLeadRepository } from "./infrastructure/db/repositories/lead-repository.ts"
import { createOptOutRepository } from "./infrastructure/db/repositories/opt-out-repository.ts"
import { createPipelineStepRepository } from "./infrastructure/db/repositories/pipeline-step-repository.ts"
import { createSettingsRepository } from "./infrastructure/db/repositories/settings-repository.ts"
import { createImapInbound } from "./infrastructure/email/imap-inbound.ts"
import { createResendService } from "./infrastructure/email/resend-service.ts"
import { createMxVerifier } from "./infrastructure/email-verification/mx-verifier.ts"
import { createLinkedInService } from "./infrastructure/linkedin/linkedin-service.ts"
import { createNoopNotificationService } from "./infrastructure/notification/noop-service.ts"
import { createSlackNotificationService } from "./infrastructure/notification/slack-service.ts"
import {
	createRequestLogger,
	logger,
} from "./infrastructure/observability/logger.ts"
import { createPipelineQueue } from "./infrastructure/queue/bullmq-pipeline-queue.ts"
import { createDeepcrawlService } from "./infrastructure/scraper/deepcrawl-service.ts"
import { createLocalDiskStorage } from "./infrastructure/storage/local-disk-storage.ts"
import { appRouter } from "./presentation/routers/index.ts"

const __dirname = dirname(fileURLToPath(import.meta.url))

function readAppVersion(): string {
	const candidates = [
		resolve(__dirname, "../../../package.json"),
		resolve(process.cwd(), "package.json"),
	]
	for (const candidate of candidates) {
		try {
			const pkg = JSON.parse(readFileSync(candidate, "utf-8"))
			if (pkg.version) return pkg.version
		} catch {
			/* try next */
		}
	}
	return "0.0.0"
}

const APP_VERSION = readAppVersion()

function renderUnsubscribePage(
	opts: { status: "ok"; email: string } | { status: "error"; message: string },
): string {
	const body =
		opts.status === "ok"
			? `<h1>You're unsubscribed</h1><p>The address <strong>${opts.email}</strong> will no longer receive emails from us.</p>`
			: `<h1>Couldn't unsubscribe</h1><p>${opts.message}</p>`
	return `<!doctype html><html><head><meta charset="utf-8"><title>Unsubscribe</title><style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:80px auto;padding:0 24px;color:#111827;line-height:1.5}h1{font-size:20px;margin-bottom:12px}p{color:#374151}</style></head><body>${body}</body></html>`
}

export async function createServerApp() {
	// 1. Initialize Infrastructure
	const db = createDb(env.DATABASE_URL)
	const cache = createRedisCache(env.REDIS_URL)

	const repos = {
		lead: createLeadRepository(db),
		sequence: createEmailSequenceRepository(db),
		message: createEmailMessageRepository(db),
		settings: createSettingsRepository(db),
		optOut: createOptOutRepository(db),
	}

	const settingsService = new SettingsService(repos.settings, cache)
	const scraper = createDeepcrawlService({ apiKey: env.DEEPCRAWL_API_KEY })

	const fileStorage = createLocalDiskStorage({ root: env.UPLOAD_DIR })

	const services = {
		emailVerifier: createMxVerifier(),
		scraper,
		linkedin: createLinkedInService({
			allowCrawling: env.LINKEDIN_CRAWLING_PERMISSION_CONFIRMED,
			scraper,
			logger,
		}),
		ai: createOpenRouterService({
			apiKey: env.OPENROUTER_API_KEY,
			settings: settingsService,
		}),
		email: createResendService({
			apiKey: env.RESEND_API_KEY,
			senderEmail: env.SENDER_EMAIL,
			senderName: env.SENDER_NAME,
			settings: settingsService,
		}),
		cache,
		settings: settingsService,
		notifier: env.SLACK_WEBHOOK_URL
			? createSlackNotificationService(env.SLACK_WEBHOOK_URL)
			: createNoopNotificationService(),
		fileStorage,
	}

	const tracker = createPipelineStepRepository(db)

	const publicApiBase = env.PUBLIC_API_URL ?? `http://localhost:${env.PORT}`
	const unsubscribeSecret = env.UNSUBSCRIBE_SECRET ?? env.BETTER_AUTH_SECRET

	const queueHandle = createPipelineQueue({
		redisUrl: env.REDIS_URL,
		concurrency: env.PIPELINE_WORKER_CONCURRENCY,
		rateLimit: {
			max: env.PIPELINE_RATE_MAX,
			duration: env.PIPELINE_RATE_DURATION_MS,
		},
		logger,
	})

	const inboundMailbox =
		env.IMAP_ENABLED && env.IMAP_HOST && env.IMAP_USER && env.IMAP_PASSWORD
			? createImapInbound({
					host: env.IMAP_HOST,
					port: env.IMAP_PORT,
					secure: env.IMAP_SECURE,
					user: env.IMAP_USER,
					password: env.IMAP_PASSWORD,
					mailbox: env.IMAP_MAILBOX,
					batchSize: env.IMAP_BATCH_SIZE,
					logger,
				})
			: undefined

	// 2. Build Application Use Cases
	const useCases = buildUseCases({
		repos: {
			lead: repos.lead,
			sequence: repos.sequence,
			message: repos.message,
			optOut: repos.optOut,
		},
		services,
		tracker,
		logger,
		jobQueue: queueHandle.queue,
		inboundMailbox,
		config: {
			unsubscribe: {
				baseUrl: publicApiBase,
				secret: unsubscribeSecret,
			},
			sendEmail: {
				senderName: env.SENDER_NAME,
				senderCompany: env.SENDER_COMPANY,
			},
			companyProfile: {
				maxBytes: env.UPLOAD_MAX_BYTES,
			},
		},
	})

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
					tags: z.record(z.string()).optional(),
				})
				.passthrough(),
		})
		.passthrough()

	// Unsubscribe (public, token-protected). Both GET and POST register opt-out
	// because RFC 8058 one-click unsubscribe requires POST, but many MUAs
	// preview/click the link as GET.
	const unsubscribeHandler = async (c: any) => {
		const token = c.req.param("token")
		const encodedEmail = c.req.query("e")
		const reason = c.req.query("reason")
		if (!encodedEmail) {
			return c.html(
				renderUnsubscribePage({
					status: "error",
					message: "Missing email parameter.",
				}),
				400,
			)
		}
		try {
			const result = await useCases.optOut.unsubscribeByToken({
				token,
				encodedEmail,
				reason,
			})
			return c.html(
				renderUnsubscribePage({ status: "ok", email: result.email }),
			)
		} catch (err) {
			logger.warn({ err }, "Unsubscribe failed")
			return c.html(
				renderUnsubscribePage({
					status: "error",
					message: "Invalid or expired unsubscribe link.",
				}),
				400,
			)
		}
	}
	app.get("/unsubscribe/:token", unsubscribeHandler)
	app.post("/unsubscribe/:token", unsubscribeHandler)

	// Company-profile upload routes (multipart — oRPC is poor at binary).
	// Auth: Better Auth session OR x-api-key header (matches protectedProcedure
	// semantics). One file at a time, capped at UPLOAD_MAX_BYTES.
	const requireAuth = async (
		c: any,
	): Promise<{ userId: string | null } | Response> => {
		const apiKey = c.req.header("x-api-key")
		if (env.API_KEY && apiKey === env.API_KEY) return { userId: null }
		const session = await auth.api.getSession({ headers: c.req.raw.headers })
		if (!session) return c.json({ error: "unauthorized" }, 401)
		return { userId: session.user.id }
	}

	app.post("/api/uploads/company-profile", async (c) => {
		const authResult = await requireAuth(c)
		if (authResult instanceof Response) return authResult

		const contentLength = Number(c.req.header("content-length") ?? "0")
		if (contentLength > env.UPLOAD_MAX_BYTES * 2) {
			return c.json({ error: "payload_too_large" }, 413)
		}

		const body = await c.req.parseBody({ all: false })
		const file = body.file
		if (!(file instanceof File)) {
			return c.json({ error: "missing 'file' field" }, 400)
		}

		const bytes = Buffer.from(await file.arrayBuffer())
		try {
			const meta = await useCases.companyProfile.upload({
				bytes,
				mime: file.type || "application/octet-stream",
				fileName: file.name || "company-profile",
				updatedBy: authResult.userId ?? undefined,
			})
			return c.json({ ok: true, file: meta })
		} catch (err: any) {
			if (err?.code === "BAD_REQUEST") {
				return c.json({ error: err.message }, 400)
			}
			logger.error({ err }, "Company profile upload failed")
			return c.json({ error: "upload_failed" }, 500)
		}
	})

	app.delete("/api/uploads/company-profile", async (c) => {
		const authResult = await requireAuth(c)
		if (authResult instanceof Response) return authResult
		try {
			await useCases.companyProfile.clearFile(authResult.userId ?? undefined)
			return c.json({ ok: true })
		} catch (err) {
			logger.error({ err }, "Company profile clear failed")
			return c.json({ error: "clear_failed" }, 500)
		}
	})

	// Health checks
	app.get("/healthz", (c) => c.json({ status: "ok", version: APP_VERSION }))
	app.get("/ready", async (c) => {
		try {
			const redisOk = await cache.ping()
			return c.json({ redis: redisOk })
		} catch {
			return c.json({ redis: false }, 503)
		}
	})

	// Webhooks
	app.post("/webhooks/resend", async (c) => {
		const requestLogger = createRequestLogger(c.get("requestId") ?? "")

		try {
			const payload = await c.req.text()
			const webhookSecret = env.RESEND_WEBHOOK_SECRET

			if (!webhookSecret && env.NODE_ENV === "production") {
				return c.json({ error: "webhook_not_configured" }, 503)
			}

			let event: unknown

			if (webhookSecret) {
				const svixId = c.req.header("svix-id")
				const svixTimestamp = c.req.header("svix-timestamp")
				const svixSignature = c.req.header("svix-signature")

				if (!svixId || !svixTimestamp || !svixSignature) {
					return c.json({ error: "Missing webhook signature" }, 401)
				}

				try {
					event = services.email.verifyWebhook(
						payload,
						{
							"svix-id": svixId,
							"svix-timestamp": svixTimestamp,
							"svix-signature": svixSignature,
						},
						webhookSecret,
					)
				} catch (_err) {
					return c.json({ error: "Invalid signature" }, 401)
				}
			} else {
				event = JSON.parse(payload)
			}

			const parsedEvent = ResendWebhookSchema.parse(event)

			if (
				parsedEvent.type === "email.received" ||
				parsedEvent.type === "email.replied"
			) {
				const emailId = parsedEvent.data.email_id

				if (parsedEvent.type === "email.received" && emailId) {
					;(async () => {
						try {
							const receivedEmail =
								await services.email.getReceivedEmail(emailId)
							await useCases.email.handleReply({
								fromEmail: receivedEmail.fromEmail,
								subject: receivedEmail.subject,
								textBody: receivedEmail.textBody,
								messageId: receivedEmail.messageId,
							})
						} catch (err) {
							requestLogger.error(
								{ err, emailId },
								"Background reply handling failed",
							)
						}
					})()
				} else if (parsedEvent.data.from) {
					useCases.email
						.handleReply({
							fromEmail: parsedEvent.data.from,
							subject: parsedEvent.data.subject || "No Subject",
							textBody:
								parsedEvent.data.text || parsedEvent.data.html || "No body",
							messageId: parsedEvent.data.message_id || "",
						})
						.catch((err) =>
							requestLogger.error({ err }, "Background reply handling failed"),
						)
				}
			}

			if (parsedEvent.type === "email.bounced") {
				const leadId = parsedEvent.data.tags?.lead_id
				if (leadId) {
					useCases.lead
						.updateStatus(leadId, "bounced")
						.catch((err) =>
							requestLogger.error(
								{ err, leadId },
								"Failed to update lead status to bounced",
							),
						)
				}
			}

			return c.json({ received: true })
		} catch (_error) {
			return c.json({ error: "Invalid webhook payload" }, 400)
		}
	})

	// Mount oRPC
	app.all("/rpc/*", async (c, next) => {
		const requestLogger = createRequestLogger(c.get("requestId") ?? "")
		const { matched, response } = await rpcHandler.handle(c.req.raw, {
			prefix: "/rpc",
			context: {
				headers: c.req.raw.headers,
				session: null,
				useCases,
				requestId: c.get("requestId") ?? "",
				logger: requestLogger,
			},
		})
		if (matched) return c.newResponse(response.body, response)
		await next()
	})

	// Serve frontend SPA (must be last — after all API routes)
	if (env.WEB_DIST_PATH) {
		app.use("*", serveStatic({ root: env.WEB_DIST_PATH }))
		// SPA fallback: any unmatched route → index.html (for client-side routing)
		app.get("*", serveStatic({ root: env.WEB_DIST_PATH, path: "index.html" }))
	}

	return { app, useCases, queueHandle }
}
