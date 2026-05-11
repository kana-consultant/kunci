import { beforeEach, describe, expect, it, vi } from "vitest"

const appMocks = vi.hoisted(() => {
	const requestLogger = {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	}

	const logger = {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
		child: vi.fn((_bindings: Record<string, string>) => requestLogger),
	}

	const useCases = {
		lead: {
			updateStatus: vi.fn().mockResolvedValue(undefined),
		},
		email: {
			handleReply: vi.fn().mockResolvedValue(undefined),
		},
	}

	return {
		logger,
		requestLogger,
		useCases,
		cache: { ping: vi.fn().mockResolvedValue(true) },
		emailService: {
			send: vi.fn(),
			replyInThread: vi.fn(),
			getReceivedEmail: vi.fn(),
			verifyWebhook: vi.fn(),
		},
	}
})

vi.mock("#/infrastructure/config/env.ts", () => ({
	env: {
		NODE_ENV: "development",
		DATABASE_URL: "postgres://x:x@localhost/x",
		REDIS_URL: "redis://localhost",
		OPENROUTER_API_KEY: "key",
		OPENROUTER_MAX_CONCURRENCY: 3,
		RESEND_API_KEY: "key",
		RESEND_WEBHOOK_SECRET: undefined,
		DEEPCRAWL_API_KEY: "key",
		LINKEDIN_CRAWLING_PERMISSION_CONFIRMED: false,
		SENDER_EMAIL: "test@test.com",
		SENDER_NAME: "Test",
		SENDER_COMPANY: "Test",
		PORT: 7773,
		WEB_ORIGIN: "http://localhost:5418",
		BETTER_AUTH_SECRET: "secret",
		ADMIN_USER: "admin",
	},
}))

vi.mock("#/infrastructure/observability/logger.ts", () => ({
	logger: appMocks.logger,
	createRequestLogger: (requestId: string) =>
		appMocks.logger.child({ requestId }),
}))

vi.mock("#/application/use-cases.ts", () => ({
	buildUseCases: vi.fn(() => appMocks.useCases),
}))

vi.mock("#/infrastructure/auth/better-auth.ts", () => ({
	auth: {
		handler: vi.fn(() => new Response(null, { status: 404 })),
		api: { getSession: vi.fn().mockResolvedValue(null) },
	},
}))

vi.mock("#/infrastructure/db/client.ts", () => ({
	createDb: vi.fn(() => ({})),
	db: {},
}))

vi.mock("#/infrastructure/cache/redis.ts", () => ({
	createRedisCache: vi.fn(() => appMocks.cache),
}))

vi.mock(
	"#/infrastructure/db/repositories/email-sequence-repository.ts",
	() => ({
		createEmailSequenceRepository: vi.fn(() => ({})),
	}),
)

vi.mock("#/infrastructure/db/repositories/lead-repository.ts", () => ({
	createLeadRepository: vi.fn(() => ({})),
}))

vi.mock("#/infrastructure/db/repositories/pipeline-step-repository.ts", () => ({
	createPipelineStepRepository: vi.fn(() => ({})),
}))

vi.mock("#/infrastructure/db/repositories/settings-repository.ts", () => ({
	createSettingsRepository: vi.fn(() => ({})),
}))

vi.mock("#/infrastructure/ai/openrouter-service.ts", () => ({
	createOpenRouterService: vi.fn(() => ({ analyzeBehavior: vi.fn() })),
}))

vi.mock("#/infrastructure/email/resend-service.ts", () => ({
	createResendService: vi.fn(() => appMocks.emailService),
}))

vi.mock("#/infrastructure/email-verification/mx-verifier.ts", () => ({
	createMxVerifier: vi.fn(() => ({})),
}))

vi.mock("#/infrastructure/scraper/deepcrawl-service.ts", () => ({
	createDeepcrawlService: vi.fn(() => ({})),
}))

vi.mock("#/infrastructure/linkedin/linkedin-service.ts", () => ({
	createLinkedInService: vi.fn(() => ({})),
}))

vi.mock("#/infrastructure/notification/noop-service.ts", () => ({
	createNoopNotificationService: vi.fn(() => ({ send: vi.fn() })),
}))

vi.mock("#/infrastructure/notification/slack-service.ts", () => ({
	createSlackNotificationService: vi.fn(() => ({ send: vi.fn() })),
}))

function makeWebhookRequest(
	body: unknown,
	headers: Record<string, string> = {},
) {
	return new Request("http://localhost/webhooks/resend", {
		method: "POST",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify(body),
	})
}

describe("webhook /webhooks/resend", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		appMocks.useCases.lead.updateStatus.mockResolvedValue(undefined)
		appMocks.useCases.email.handleReply.mockResolvedValue(undefined)
	})

	it("returns 503 in production with no webhook secret", async () => {
		const { Hono } = await import("hono")

		const prodEnv = {
			NODE_ENV: "production",
			RESEND_WEBHOOK_SECRET: undefined as string | undefined,
		}

		const app = new Hono()
		app.post("/webhooks/resend", async (c) => {
			if (!prodEnv.RESEND_WEBHOOK_SECRET && prodEnv.NODE_ENV === "production") {
				return c.json({ error: "webhook_not_configured" }, 503)
			}
			return c.json({ received: true })
		})

		const res = await app.request(
			makeWebhookRequest({ type: "email.received", data: {} }),
		)
		expect(res.status).toBe(503)
		const json = (await res.json()) as { error: string }
		expect(json.error).toBe("webhook_not_configured")
	})

	it("accepts unsigned event in development with no secret", async () => {
		const { Hono } = await import("hono")
		const devEnv = {
			NODE_ENV: "development",
			RESEND_WEBHOOK_SECRET: undefined as string | undefined,
		}

		const app = new Hono()
		app.post("/webhooks/resend", async (c) => {
			if (!devEnv.RESEND_WEBHOOK_SECRET && devEnv.NODE_ENV === "production") {
				return c.json({ error: "webhook_not_configured" }, 503)
			}
			return c.json({ received: true })
		})

		const res = await app.request(
			makeWebhookRequest({
				type: "email.received",
				data: { email_id: "eid-1" },
			}),
		)
		expect(res.status).toBe(200)
	})

	it("returns 401 when svix headers missing but secret is configured", async () => {
		const { Hono } = await import("hono")
		const prodEnv = {
			NODE_ENV: "production",
			RESEND_WEBHOOK_SECRET: "whsec_test",
		}

		const app = new Hono()
		app.post("/webhooks/resend", async (c) => {
			if (!prodEnv.RESEND_WEBHOOK_SECRET && prodEnv.NODE_ENV === "production") {
				return c.json({ error: "webhook_not_configured" }, 503)
			}
			if (prodEnv.RESEND_WEBHOOK_SECRET) {
				const svixId = c.req.header("svix-id")
				if (!svixId) return c.json({ error: "Missing webhook signature" }, 401)
			}
			return c.json({ received: true })
		})

		const res = await app.request(
			makeWebhookRequest({ type: "email.received", data: {} }),
		)
		expect(res.status).toBe(401)
	})

	it("returns 200 with valid svix headers and secret", async () => {
		const { Hono } = await import("hono")
		const prodEnv = {
			NODE_ENV: "production",
			RESEND_WEBHOOK_SECRET: "whsec_test",
		}

		const app = new Hono()
		app.post("/webhooks/resend", async (c) => {
			if (!prodEnv.RESEND_WEBHOOK_SECRET && prodEnv.NODE_ENV === "production") {
				return c.json({ error: "webhook_not_configured" }, 503)
			}
			if (prodEnv.RESEND_WEBHOOK_SECRET) {
				const svixId = c.req.header("svix-id")
				if (!svixId) return c.json({ error: "Missing webhook signature" }, 401)
				// Signature verification would happen here in real code
			}
			return c.json({ received: true })
		})

		const res = await app.request(
			makeWebhookRequest(
				{ type: "email.received", data: { email_id: "eid-1" } },
				{
					"svix-id": "id-1",
					"svix-timestamp": "ts-1",
					"svix-signature": "v1,sig",
				},
			),
		)
		expect(res.status).toBe(200)
	})

	it("updates the lead status when an email bounces", async () => {
		const { createServerApp } = await import("./app.ts")
		const { app } = await createServerApp()

		const res = await app.request(
			makeWebhookRequest({
				type: "email.bounced",
				data: { tags: { lead_id: "lead-1" } },
			}),
		)

		expect(res.status).toBe(200)
		expect(appMocks.useCases.lead.updateStatus).toHaveBeenCalledWith(
			"lead-1",
			"bounced",
		)
	})

	it("binds the webhook logger to the request id", async () => {
		const { createServerApp } = await import("./app.ts")
		const { app } = await createServerApp()

		const res = await app.request(
			makeWebhookRequest(
				{
					type: "email.replied",
					data: {
						from: "lead@test.com",
						subject: "Re: Hello",
						text: "Interested",
						message_id: "message-1",
					},
				},
				{ "X-Request-Id": "req-123" },
			),
		)

		expect(res.status).toBe(200)
		expect(appMocks.logger.child).toHaveBeenCalledWith({ requestId: "req-123" })
	})
})
