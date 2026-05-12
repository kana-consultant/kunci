import { beforeEach, describe, expect, it, vi } from "vitest"
import { SETTING_KEYS } from "#/domain/settings/setting-keys.ts"
import { createResendService } from "./resend-service.ts"

const resendMocks = vi.hoisted(() => ({
	send: vi.fn(),
	receivingGet: vi.fn(),
	verifyWebhook: vi.fn(),
}))

vi.mock("#/infrastructure/observability/logger.ts", () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
}))

vi.mock("resend", () => ({
	Resend: vi.fn(() => ({
		emails: {
			send: resendMocks.send,
			receiving: {
				get: resendMocks.receivingGet,
			},
		},
		webhooks: {
			verify: resendMocks.verifyWebhook,
		},
	})),
}))

describe("createResendService", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		resendMocks.send.mockResolvedValue({ data: { id: "msg-1" }, error: null })
	})

	it("uses sender settings when sending new emails", async () => {
		const settings = makeSettings({
			[SETTING_KEYS.EMAIL_SENDER_NAME]: "Configured SDR",
			[SETTING_KEYS.EMAIL_SENDER_EMAIL]: "sdr@example.com",
		})
		const service = createResendService({
			apiKey: "re_test",
			senderEmail: "env@example.com",
			senderName: "Env SDR",
			settings,
		})

		await service.send({
			to: "lead@example.com",
			subject: "Hello",
			html: "<p>Hello</p>",
			leadId: "lead-1",
			stage: 1,
		})

		expect(resendMocks.send).toHaveBeenCalledWith(
			expect.objectContaining({
				from: "Configured SDR <sdr@example.com>",
			}),
			expect.any(Object),
		)
	})

	it("falls back to env sender email when the setting is blank", async () => {
		const settings = makeSettings({
			[SETTING_KEYS.EMAIL_SENDER_NAME]: "Configured SDR",
			[SETTING_KEYS.EMAIL_SENDER_EMAIL]: "",
		})
		const service = createResendService({
			apiKey: "re_test",
			senderEmail: "env@example.com",
			senderName: "Env SDR",
			settings,
		})

		await service.replyInThread({
			to: "lead@example.com",
			subject: "Re: Hello",
			html: "<p>Hello</p>",
			originalMessageId: "msg-0",
			previousRefs: ["msg-0"],
			leadId: "lead-1",
			stage: 2,
		})

		expect(resendMocks.send).toHaveBeenCalledWith(
			expect.objectContaining({
				from: "Configured SDR <env@example.com>",
			}),
			expect.any(Object),
		)
	})
})

function makeSettings(values: Record<string, string>) {
	return {
		get: vi.fn(async <T>(key: string, defaultValue?: T): Promise<T> => {
			if (key in values) return values[key] as T
			return defaultValue as T
		}),
	}
}
