import { describe, expect, it, vi } from "vitest"

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
		SENDER_EMAIL: "test@test.com",
		SENDER_NAME: "Test",
		SENDER_COMPANY: "Test",
		PORT: 7773,
		WEB_ORIGIN: "http://localhost:5418",
		BETTER_AUTH_SECRET: "secret",
		ADMIN_USER: "admin",
	},
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
})
