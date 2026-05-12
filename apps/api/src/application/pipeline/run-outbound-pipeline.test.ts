import { beforeEach, describe, expect, it, vi } from "vitest"
import { makeRunOutboundPipelineUseCase } from "./run-outbound-pipeline.ts"

describe("runOutboundPipeline", () => {
	const mockTracker = {
		startStep: vi.fn().mockResolvedValue("step-123"),
		completeStep: vi.fn(),
		failStep: vi.fn(),
		getStepsForLead: vi.fn(),
	}

	const mockDeps = {
		captureLead: vi.fn(),
		enrichLead: vi.fn(),
		researchCompany: vi.fn(),
		analyzeBehavior: vi.fn(),
		sendInitialEmail: vi.fn(),
		updateLeadStatus: vi.fn(),
		tracker: mockTracker as any,
		logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
		notifier: { send: vi.fn() },
	}

	beforeEach(() => {
		vi.clearAllMocks()
		mockDeps.notifier.send.mockResolvedValue(undefined)
		mockDeps.enrichLead.mockImplementation(async (lead: any) => ({
			updatedLead: lead,
			signals: {
				recentSignals: null,
				painPointHypothesis: null,
				targetMarket: null,
			},
		}))
	})

	it("should complete the pipeline successfully", async () => {
		mockDeps.captureLead.mockResolvedValue({
			id: "lead-1",
			email: "test@test.com",
			companyWebsite: "acme.com",
		})
		mockDeps.researchCompany.mockResolvedValue({
			companyProfile: "Test Profile",
			websiteAnalysis: { brandName: "Acme", industryCategory: "Tech" },
			rawMarkdown: "# Home",
		})
		mockDeps.analyzeBehavior.mockResolvedValue({
			conversionProbability: 0.8,
			journeyStage: "Awareness",
		})

		const runPipeline = makeRunOutboundPipelineUseCase(mockDeps)

		const result = await runPipeline({
			fullName: "John",
			email: "test@test.com",
			companyName: "Acme",
			companyWebsite: "acme.com",
		})

		expect(result.status).toBe("email_sent")
		expect(mockDeps.captureLead).toHaveBeenCalledTimes(1)
		expect(mockDeps.sendInitialEmail).toHaveBeenCalledTimes(1)
		expect(mockTracker.completeStep).toHaveBeenCalled()
	})

	it("should handle failure and update lead status", async () => {
		mockDeps.captureLead.mockResolvedValue({
			id: "lead-1",
			email: "test@test.com",
			companyWebsite: "acme.com",
		})
		mockDeps.researchCompany.mockRejectedValue(new Error("Scraping failed"))

		const runPipeline = makeRunOutboundPipelineUseCase(mockDeps)

		const result = await runPipeline({
			fullName: "John",
			email: "test@test.com",
			companyName: "Acme",
			companyWebsite: "acme.com",
		})

		expect(result.status).toBe("partial_failure")
		expect(mockDeps.updateLeadStatus).toHaveBeenCalledWith(
			"lead-1",
			"research_failed",
		)
		expect(mockTracker.failStep).toHaveBeenCalledWith(
			"step-123",
			"Scraping failed",
			expect.any(Object),
		)
	})

	it("should notify when the pipeline fails after lead capture", async () => {
		mockDeps.captureLead.mockResolvedValue({
			id: "lead-1",
			email: "test@test.com",
			companyWebsite: "acme.com",
		})
		mockDeps.researchCompany.mockRejectedValue(new Error("Scraping failed"))

		const runPipeline = makeRunOutboundPipelineUseCase(mockDeps)

		await runPipeline({
			fullName: "John",
			email: "test@test.com",
			companyName: "Acme",
			companyWebsite: "acme.com",
		})

		expect(mockDeps.notifier.send).toHaveBeenCalledWith({
			type: "pipeline.failed",
			leadId: "lead-1",
			error: "Scraping failed",
		})
	})
})
