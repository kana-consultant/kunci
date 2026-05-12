import { beforeEach, describe, expect, it, vi } from "vitest"
import { makeHandleReplyUseCase } from "./handle-reply.ts"

function makeMocks() {
	return {
		leadRepo: {
			findByEmail: vi.fn(),
			findById: vi.fn(),
			update: vi.fn(),
		},
		messageRepo: {
			append: vi.fn().mockResolvedValue({}),
			listByLeadId: vi.fn().mockResolvedValue([]),
			countOutbound: vi.fn().mockResolvedValue(0),
		},
		ai: {
			classifyIntent: vi.fn(),
			generateChatReply: vi.fn(),
			convertToHtml: vi.fn(),
		},
		emailService: {
			replyInThread: vi.fn(),
		},
		settings: {
			get: vi.fn(async (_key: string, fallback: unknown) => fallback),
		},
		notifier: {
			send: vi.fn().mockResolvedValue(undefined),
		},
		registerOptOut: vi.fn().mockResolvedValue(undefined),
		logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
		scheduleDelayedSend: vi.fn((fn: () => Promise<void>, _ms: number) => {
			// fire synchronously in tests
			void fn()
		}),
	}
}

describe("handleReply (chat mode)", () => {
	let mocks: ReturnType<typeof makeMocks>

	beforeEach(() => {
		mocks = makeMocks()
	})

	it("ignores unknown lead", async () => {
		mocks.leadRepo.findByEmail.mockResolvedValue(null)
		const handleReply = makeHandleReplyUseCase(mocks as any)

		const result = await handleReply({
			fromEmail: "unknown@test.com",
			subject: "Re: Hi",
			textBody: "Hi",
			messageId: "m1",
		})

		expect(result.status).toBe("ignored")
		expect(result.reason).toBe("unknown_lead")
	})

	it("ignores completed lead", async () => {
		mocks.leadRepo.findByEmail.mockResolvedValue({
			id: "l1",
			email: "x@y.z",
			stage: 2,
			replyStatus: "completed",
			completedReason: "won",
		})
		const handleReply = makeHandleReplyUseCase(mocks as any)

		const result = await handleReply({
			fromEmail: "x@y.z",
			subject: "Re",
			textBody: "thanks",
			messageId: "m",
		})

		expect(result.status).toBe("ignored")
		expect(result.reason).toBe("lead_completed")
	})

	it("marks lead completed when intent is unsubscribe", async () => {
		mocks.leadRepo.findByEmail.mockResolvedValue({
			id: "l1",
			email: "x@y.z",
			stage: 1,
			replyStatus: "awaiting",
			latestMessageId: "orig",
			messageIds: ["orig"],
			autoReplyTurns: 0,
		})
		mocks.ai.classifyIntent.mockResolvedValue({
			intent: "unsubscribe",
			confidence: 0.95,
			reasoning: "Lead said stop emailing me",
		})

		const handleReply = makeHandleReplyUseCase(mocks as any)
		const result = await handleReply({
			fromEmail: "x@y.z",
			subject: "Re: Hello",
			textBody: "Please stop emailing me, unsubscribe",
			messageId: "msg-2",
		})

		expect(result.action).toBe("completed")
		expect(result.reason).toBe("opted_out")
		expect(mocks.leadRepo.update).toHaveBeenCalledWith("l1", {
			replyStatus: "opted_out",
			completedReason: "opted_out",
		})
		expect(mocks.registerOptOut).toHaveBeenCalledWith({
			email: "x@y.z",
			reason: "Lead said stop emailing me",
			source: "reply_classification",
		})
		expect(mocks.ai.generateChatReply).not.toHaveBeenCalled()
		expect(mocks.notifier.send).toHaveBeenCalled()
	})

	it("marks lead completed (won) on interested intent", async () => {
		mocks.leadRepo.findByEmail.mockResolvedValue({
			id: "l1",
			email: "x@y.z",
			stage: 1,
			replyStatus: "awaiting",
			latestMessageId: "orig",
			messageIds: ["orig"],
			autoReplyTurns: 0,
		})
		mocks.ai.classifyIntent.mockResolvedValue({
			intent: "interested",
			confidence: 0.9,
			reasoning: "Asked to book a call",
		})

		const handleReply = makeHandleReplyUseCase(mocks as any)
		const result = await handleReply({
			fromEmail: "x@y.z",
			subject: "Re",
			textBody: "let's book a call",
			messageId: "m",
		})

		expect(result.reason).toBe("won")
		expect(mocks.ai.generateChatReply).not.toHaveBeenCalled()
	})

	it("stops at hard turn cap", async () => {
		mocks.leadRepo.findByEmail.mockResolvedValue({
			id: "l1",
			email: "x@y.z",
			stage: 1,
			replyStatus: "awaiting",
			latestMessageId: "orig",
			messageIds: ["orig"],
			autoReplyTurns: 6,
		})
		mocks.ai.classifyIntent.mockResolvedValue({
			intent: "neutral",
			confidence: 0.4,
			reasoning: "ack",
		})
		mocks.settings.get.mockImplementation(
			async (key: string, fallback: unknown) =>
				key === "auto_reply.max_turns" ? 6 : fallback,
		)

		const handleReply = makeHandleReplyUseCase(mocks as any)
		const result = await handleReply({
			fromEmail: "x@y.z",
			subject: "Re",
			textBody: "ok",
			messageId: "m",
		})

		expect(result.action).toBe("cap_reached")
		expect(mocks.ai.generateChatReply).not.toHaveBeenCalled()
	})

	it("queues a chat reply for continuing intents", async () => {
		const lead = {
			id: "l1",
			email: "x@y.z",
			fullName: "Lead One",
			companyName: "Acme",
			stage: 1,
			replyStatus: "awaiting",
			latestMessageId: "orig",
			messageIds: ["orig"],
			autoReplyTurns: 1,
			painPoints: null,
		}
		mocks.leadRepo.findByEmail.mockResolvedValue(lead)
		mocks.leadRepo.findById.mockResolvedValue(lead)
		mocks.ai.classifyIntent.mockResolvedValue({
			intent: "question",
			confidence: 0.8,
			reasoning: "asked about pricing",
		})
		mocks.ai.generateChatReply.mockResolvedValue({
			subject: "Re: Hello",
			content: "Pricing details...",
		})
		mocks.ai.convertToHtml.mockResolvedValue("<p>Pricing</p>")
		mocks.emailService.replyInThread.mockResolvedValue({
			messageId: "out-1",
			sentAt: new Date(),
		})

		const handleReply = makeHandleReplyUseCase(mocks as any)
		const result = await handleReply({
			fromEmail: "x@y.z",
			subject: "Re: Hello",
			textBody: "how much does it cost?",
			messageId: "in-1",
		})

		expect(result.action).toBe("queued")
		expect(mocks.scheduleDelayedSend).toHaveBeenCalled()

		// Wait microtask for synchronous-fire stub to finish
		await new Promise((r) => setImmediate(r))

		expect(mocks.ai.generateChatReply).toHaveBeenCalled()
		expect(mocks.emailService.replyInThread).toHaveBeenCalled()
		expect(mocks.messageRepo.append).toHaveBeenCalledWith(
			expect.objectContaining({ direction: "outbound" }),
		)
	})
})
