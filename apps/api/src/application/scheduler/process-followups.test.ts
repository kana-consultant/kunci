import { beforeEach, describe, expect, it, vi } from "vitest"
import { makeProcessPendingFollowupsUseCase } from "./process-followups.ts"

function makeLead(id: string) {
	return {
		id,
		email: `${id}@acme.com`,
		fullName: "Test",
		companyName: "Acme",
		companyWebsite: "https://acme.com",
		stage: 1,
		replyStatus: "awaiting",
		latestMessageId: `msg-${id}`,
		linkedinUrl: null,
		messageIds: [`msg-${id}`],
		painPoints: null,
		leadSource: null,
		companyResearch: null,
		lastEmailSentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
		createdAt: new Date(),
		updatedAt: new Date(),
	}
}

describe("processFollowups", () => {
	const mockDeps = {
		leadRepo: { findPendingFollowups: vi.fn() },
		sendFollowup: vi.fn(),
		settings: { get: vi.fn() },
		logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
	}

	beforeEach(() => {
		vi.clearAllMocks()
		vi.useRealTimers()
		mockDeps.settings.get.mockResolvedValue(4)
	})

	it("processes qualifying leads and returns counters", async () => {
		const leads = [makeLead("a"), makeLead("b")]
		mockDeps.leadRepo.findPendingFollowups.mockResolvedValue(leads)
		mockDeps.sendFollowup.mockResolvedValue(undefined)

		const process = makeProcessPendingFollowupsUseCase(mockDeps as any)
		const result = await process()

		expect(result.processed).toBe(2)
		expect(result.errors).toBe(0)
		expect(mockDeps.leadRepo.findPendingFollowups).toHaveBeenCalledWith({
			replyStatus: "awaiting",
			maxStage: 2,
			lastEmailBefore: expect.any(Date),
		})
	})

	it("uses configured follow-up delay from settings", async () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date("2026-01-10T00:00:00.000Z"))
		mockDeps.settings.get.mockResolvedValue(7)
		mockDeps.leadRepo.findPendingFollowups.mockResolvedValue([])

		const process = makeProcessPendingFollowupsUseCase(mockDeps as any)
		await process()

		expect(mockDeps.leadRepo.findPendingFollowups).toHaveBeenCalledWith(
			expect.objectContaining({
				lastEmailBefore: new Date("2026-01-03T00:00:00.000Z"),
			}),
		)
	})

	it("increments errors counter when one sendFollowup fails", async () => {
		const leads = [makeLead("a"), makeLead("b")]
		mockDeps.leadRepo.findPendingFollowups.mockResolvedValue(leads)
		mockDeps.sendFollowup
			.mockResolvedValueOnce(undefined)
			.mockRejectedValueOnce(new Error("email failed"))

		const process = makeProcessPendingFollowupsUseCase(mockDeps as any)
		const result = await process()

		expect(result.processed).toBe(1)
		expect(result.errors).toBe(1)
	})

	it("continues processing remaining leads after one failure", async () => {
		const leads = [makeLead("a"), makeLead("b"), makeLead("c")]
		mockDeps.leadRepo.findPendingFollowups.mockResolvedValue(leads)
		mockDeps.sendFollowup
			.mockRejectedValueOnce(new Error("fail"))
			.mockResolvedValue(undefined)

		const process = makeProcessPendingFollowupsUseCase(mockDeps as any)
		const result = await process()

		expect(result.processed).toBe(2)
		expect(result.errors).toBe(1)
		expect(mockDeps.sendFollowup).toHaveBeenCalledTimes(3)
	})

	it("returns zero counts when no leads pending", async () => {
		mockDeps.leadRepo.findPendingFollowups.mockResolvedValue([])

		const process = makeProcessPendingFollowupsUseCase(mockDeps as any)
		const result = await process()

		expect(result.processed).toBe(0)
		expect(result.errors).toBe(0)
	})
})
