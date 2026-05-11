import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSlackNotificationService } from "./slack-service.ts"

describe("slackNotificationService", () => {
	const fetchMock = vi.fn()

	beforeEach(() => {
		vi.clearAllMocks()
		vi.stubGlobal("fetch", fetchMock)
	})

	it("POSTs correct JSON body for lead.email_invalid event", async () => {
		fetchMock.mockResolvedValue({ ok: true })

		const service = createSlackNotificationService(
			"https://hooks.slack.com/test",
		)
		await service.send({
			type: "lead.email_invalid",
			email: "bad@nowhere.tld",
			reason: "no MX",
		})

		expect(fetchMock).toHaveBeenCalledOnce()
		const [url, init] = fetchMock.mock.calls[0]
		expect(url).toBe("https://hooks.slack.com/test")
		expect(init.method).toBe("POST")
		const body = JSON.parse(init.body)
		expect(body).toHaveProperty("text")
		expect(body.text).toContain("bad@nowhere.tld")
	})

	it("POSTs correct JSON body for pipeline.failed event", async () => {
		fetchMock.mockResolvedValue({ ok: true })

		const service = createSlackNotificationService(
			"https://hooks.slack.com/test",
		)
		await service.send({
			type: "pipeline.failed",
			leadId: "lead-1",
			error: "scrape failed",
		})

		const [, init] = fetchMock.mock.calls[0]
		const body = JSON.parse(init.body)
		expect(body.text).toContain("lead-1")
		expect(body.text).toContain("scrape failed")
	})

	it("throws when webhook returns non-ok status", async () => {
		fetchMock.mockResolvedValue({ ok: false, status: 400 })

		const service = createSlackNotificationService(
			"https://hooks.slack.com/test",
		)
		await expect(
			service.send({
				type: "pipeline.failed",
				leadId: "lead-1",
				error: "boom",
			}),
		).rejects.toThrow("Slack webhook failed: 400")
	})
})
