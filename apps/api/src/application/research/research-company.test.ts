import { beforeEach, describe, expect, it, vi } from "vitest"
import { makeResearchCompanyUseCase } from "./research-company.ts"

const baseLead = {
	id: "lead-1",
	email: "test@acme.com",
	fullName: "Test User",
	companyName: "Acme",
	companyWebsite: "https://acme.com",
	stage: 0,
	replyStatus: "researching",
	latestMessageId: null,
	linkedinUrl: null,
	messageIds: [],
	painPoints: null,
	leadSource: null,
	companyResearch: null,
	lastEmailSentAt: null,
	createdAt: new Date(),
	updatedAt: new Date(),
}

describe("researchCompany", () => {
	const mockDeps = {
		leadRepo: { update: vi.fn() },
		scraper: { readUrl: vi.fn() },
		ai: {
			analyzeWebsite: vi.fn(),
			buildCompanyProfile: vi.fn(),
		},
		logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
	}

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("returns research result on happy path", async () => {
		mockDeps.scraper.readUrl.mockResolvedValue({
			success: true,
			markdown: "# Acme\nWe make widgets",
			metadata: { title: "Acme", description: "Widget maker" },
		})
		mockDeps.ai.analyzeWebsite.mockResolvedValue({
			brandName: "Acme",
			industryCategory: "Manufacturing",
		})
		mockDeps.ai.buildCompanyProfile.mockResolvedValue(
			"Acme is a widget company",
		)
		mockDeps.leadRepo.update.mockResolvedValue({})

		const research = makeResearchCompanyUseCase(mockDeps as any)
		const result = await research(baseLead as any)

		expect(result.companyProfile).toBe("Acme is a widget company")
		expect(result.rawMarkdown).toContain("Acme")
		expect(mockDeps.leadRepo.update).toHaveBeenCalledWith("lead-1", {
			companyResearch: "Acme is a widget company",
			replyStatus: "ready",
		})
	})

	it("sets replyStatus to research_failed when scrape fails", async () => {
		mockDeps.scraper.readUrl.mockResolvedValue({
			success: false,
			markdown: null,
		})
		mockDeps.leadRepo.update.mockResolvedValue({})

		const research = makeResearchCompanyUseCase(mockDeps as any)
		await expect(research(baseLead as any)).rejects.toThrow()

		expect(mockDeps.leadRepo.update).toHaveBeenCalledWith("lead-1", {
			replyStatus: "research_failed",
		})
	})

	it("sets replyStatus to research_failed when AI fails", async () => {
		mockDeps.scraper.readUrl.mockResolvedValue({
			success: true,
			markdown: "# Acme",
			metadata: {},
		})
		mockDeps.ai.analyzeWebsite.mockRejectedValue(new Error("AI error"))
		mockDeps.leadRepo.update.mockResolvedValue({})

		const research = makeResearchCompanyUseCase(mockDeps as any)
		await expect(research(baseLead as any)).rejects.toThrow("AI error")

		expect(mockDeps.leadRepo.update).toHaveBeenCalledWith("lead-1", {
			replyStatus: "research_failed",
		})
	})

	it("sets replyStatus to research_failed when markdown is null", async () => {
		mockDeps.scraper.readUrl.mockResolvedValue({
			success: true,
			markdown: null,
		})
		mockDeps.leadRepo.update.mockResolvedValue({})

		const research = makeResearchCompanyUseCase(mockDeps as any)
		await expect(research(baseLead as any)).rejects.toThrow()

		expect(mockDeps.leadRepo.update).toHaveBeenCalledWith("lead-1", {
			replyStatus: "research_failed",
		})
	})
})
