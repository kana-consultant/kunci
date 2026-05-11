import { beforeEach, describe, expect, it, vi } from "vitest"
import {
	makeSendFollowupUseCase,
	makeSendInitialEmailUseCase,
} from "./send-email.ts"

const baseLead = (overrides: Record<string, unknown> = {}) => ({
	id: "lead-1",
	email: "test@acme.com",
	fullName: "Test User",
	companyName: "Acme",
	companyWebsite: "https://acme.com",
	stage: 0,
	replyStatus: "ready",
	latestMessageId: null,
	linkedinUrl: null,
	messageIds: [],
	painPoints: null,
	leadSource: null,
	companyResearch: null,
	lastEmailSentAt: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	...overrides,
})

const baseAnalysis = {
	behavioralProfile: "aggressive buyer",
	painPoints: "slow growth",
	journeyStage: "consideration",
	psychologicalTriggers: "fear of missing out",
	optimalApproach: "direct",
	conversionProbability: 0.7,
}

describe("sendInitialEmail", () => {
	const mockDeps = {
		leadRepo: { update: vi.fn() },
		sequenceRepo: {
			saveAll: vi.fn(),
			updateHtml: vi.fn(),
			markSent: vi.fn(),
		},
		ai: {
			generateEmailSequence: vi.fn(),
			convertToHtml: vi.fn(),
			pickSubjectLine: vi.fn(),
		},
		emailService: { send: vi.fn() },
		logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
	}

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("generates sequence, sends first email, updates lead (stage 0→1)", async () => {
		mockDeps.ai.generateEmailSequence.mockResolvedValue({
			emails: [
				{
					emailNumber: 1,
					subjectLines: ["Hey"],
					content: "Body 1",
					callToAction: "Book",
					timing: "d0",
					psychologicalTrigger: "FOMO",
				},
				{
					emailNumber: 2,
					subjectLines: ["Follow"],
					content: "Body 2",
					callToAction: "Book",
					timing: "d4",
					psychologicalTrigger: "Authority",
				},
				{
					emailNumber: 3,
					subjectLines: ["Last"],
					content: "Body 3",
					callToAction: "Book",
					timing: "d8",
					psychologicalTrigger: "Scarcity",
				},
			],
		})
		mockDeps.sequenceRepo.saveAll.mockResolvedValue([
			{ id: "seq-1", emailNumber: 1, subjectLines: ["Hey"], content: "Body 1" },
		])
		mockDeps.ai.convertToHtml.mockResolvedValue("<p>Body 1</p>")
		mockDeps.ai.pickSubjectLine.mockResolvedValue("Hey!")
		mockDeps.emailService.send.mockResolvedValue({
			messageId: "msg-1",
			sentAt: new Date(),
		})
		mockDeps.leadRepo.update.mockResolvedValue({})
		mockDeps.sequenceRepo.updateHtml.mockResolvedValue({})
		mockDeps.sequenceRepo.markSent.mockResolvedValue({})

		const sendInitial = makeSendInitialEmailUseCase(mockDeps as any)
		await sendInitial(baseLead() as any, baseAnalysis as any)

		expect(mockDeps.emailService.send).toHaveBeenCalledWith(
			expect.objectContaining({ stage: 1, to: "test@acme.com" }),
		)
		expect(mockDeps.leadRepo.update).toHaveBeenCalledWith(
			"lead-1",
			expect.objectContaining({
				stage: 1,
				replyStatus: "awaiting",
				latestMessageId: "msg-1",
			}),
		)
	})
})

describe("sendFollowupEmail", () => {
	const mockDeps = {
		leadRepo: { update: vi.fn() },
		sequenceRepo: {
			getByStage: vi.fn(),
			updateHtml: vi.fn(),
			markSent: vi.fn(),
		},
		ai: {
			convertToHtml: vi.fn(),
			pickSubjectLine: vi.fn(),
		},
		emailService: { replyInThread: vi.fn() },
		logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
	}

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("sends follow-up for stage 1→2 using thread", async () => {
		const lead = baseLead({
			stage: 1,
			latestMessageId: "msg-1",
			messageIds: ["msg-1"],
		})
		mockDeps.sequenceRepo.getByStage.mockResolvedValue({
			id: "seq-2",
			emailNumber: 2,
			subjectLines: ["Follow up"],
			content: "Body 2",
			htmlContent: null,
		})
		mockDeps.ai.convertToHtml.mockResolvedValue("<p>Body 2</p>")
		mockDeps.ai.pickSubjectLine.mockResolvedValue("Follow up!")
		mockDeps.emailService.replyInThread.mockResolvedValue({
			messageId: "msg-2",
			sentAt: new Date(),
		})
		mockDeps.leadRepo.update.mockResolvedValue({})
		mockDeps.sequenceRepo.updateHtml.mockResolvedValue({})
		mockDeps.sequenceRepo.markSent.mockResolvedValue({})

		const sendFollowup = makeSendFollowupUseCase(mockDeps as any)
		await sendFollowup(lead as any)

		expect(mockDeps.emailService.replyInThread).toHaveBeenCalledWith(
			expect.objectContaining({ stage: 2, originalMessageId: "msg-1" }),
		)
		expect(mockDeps.leadRepo.update).toHaveBeenCalledWith(
			"lead-1",
			expect.objectContaining({ stage: 2, latestMessageId: "msg-2" }),
		)
	})

	it("marks completed at stage 3 without sending", async () => {
		const lead = baseLead({
			stage: 3,
			latestMessageId: "msg-3",
			messageIds: ["msg-1", "msg-2", "msg-3"],
		})
		mockDeps.leadRepo.update.mockResolvedValue({})

		const sendFollowup = makeSendFollowupUseCase(mockDeps as any)
		await sendFollowup(lead as any)

		expect(mockDeps.leadRepo.update).toHaveBeenCalledWith("lead-1", {
			replyStatus: "completed",
		})
		expect(mockDeps.emailService.replyInThread).not.toHaveBeenCalled()
	})

	it("logs warn and returns when template missing", async () => {
		const lead = baseLead({
			stage: 1,
			latestMessageId: "msg-1",
			messageIds: ["msg-1"],
		})
		mockDeps.sequenceRepo.getByStage.mockResolvedValue(null)

		const sendFollowup = makeSendFollowupUseCase(mockDeps as any)
		await sendFollowup(lead as any)

		expect(mockDeps.emailService.replyInThread).not.toHaveBeenCalled()
		expect(mockDeps.logger.warn).toHaveBeenCalled()
	})

	it("throws AppError when latestMessageId is null", async () => {
		const lead = baseLead({ stage: 1, latestMessageId: null, messageIds: [] })
		mockDeps.sequenceRepo.getByStage.mockResolvedValue({
			id: "seq-2",
			emailNumber: 2,
			subjectLines: ["Follow"],
			content: "Body 2",
			htmlContent: null,
		})
		mockDeps.ai.convertToHtml.mockResolvedValue("<p>Body 2</p>")
		mockDeps.ai.pickSubjectLine.mockResolvedValue("Follow!")

		const sendFollowup = makeSendFollowupUseCase(mockDeps as any)
		await expect(sendFollowup(lead as any)).rejects.toMatchObject({
			code: "INTERNAL_ERROR",
		})
	})
})
