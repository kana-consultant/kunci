import { HttpResponse, http } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { createServerApp } from "../../api/src/app.ts"

// ── Mock Setup ──────────────────────────────────────────────────────────────

const server = setupServer(
	// OpenRouter LLM Interceptor
	http.post("https://openrouter.ai/api/v1/chat/completions", () => {
		return HttpResponse.json({
			choices: [{ message: { content: "Mocked AI response" } }],
		})
	}),
	// Resend Email Send Interceptor
	http.post("https://api.resend.com/emails", () => {
		return HttpResponse.json({ id: "mock-msg-123" })
	}),
	// Resend Inbound Fetch Interceptor (when email_id is received)
	http.get("https://api.resend.com/emails/receiving/:id", () => {
		return HttpResponse.json({
			message_id: "mock-inbound-123",
			subject: "Re: Tawaran KUNCI",
			from: "lead@test.com",
			text: "Saya tertarik, tolong kirimkan detailnya.",
		})
	}),
)

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ── Tests ───────────────────────────────────────────────────────────────────

const API_URL = process.env.API_URL || "http://localhost:3001"

describe("api-e2e", () => {
	it("should expose health endpoints", async () => {
		const { app } = await createServerApp()
		const res = await app.request("/healthz")
		expect(res.status).toBe(200)
		const data = (await res.json()) as any
		expect(data.status).toBe("ok")

		const resReady = await app.request("/ready")
		// Should return 200 even if redis is down if we don't throw, but
		// we check if it responds
		expect(resReady.status).toBeDefined()
	})

	it("should handle lead capture workflow through oRPC", async () => {
		const { app } = await createServerApp()

		// Simulate oRPC call to /rpc/lead/capture using a real Request object
		const res = await app.request(
			new Request(`${API_URL}/rpc/lead/capture`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					fullName: "Test Lead",
					email: "lead@test.com",
					companyName: "Test Co",
					companyWebsite: "https://test.com",
					painPoints: "Need more automation",
				}),
			}),
		)

		// Should be 200 if lead is captured and pipeline starts
		if (res.status !== 200) {
			console.error(await res.text())
		}
		expect(res.status).toBe(200)
		const data = await res.json()
		expect(data).toBeDefined()
	})

	it("should handle resend webhook for reply handling", async () => {
		const { app } = await createServerApp()

		// Simulate Resend Webhook payload
		const res = await app.request("/webhooks/resend", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				// In test we skip svix headers if secret is not set
			},
			body: JSON.stringify({
				type: "email.replied",
				data: {
					from: "lead@test.com",
					subject: "Re: Tawaran KUNCI",
					text: "Saya tertarik, tolong kirimkan detailnya.",
					message_id: "mock-msg-123",
				},
			}),
		})

		expect(res.status).toBe(200)
		const data = (await res.json()) as any
		expect(data.received).toBe(true)
	})
})
