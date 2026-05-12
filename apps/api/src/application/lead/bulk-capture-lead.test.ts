import { beforeEach, describe, expect, it, vi } from "vitest"
import { makeBulkCaptureLeadUseCase } from "./bulk-capture-lead.ts"

function makeLead(email: string) {
	return {
		id: `lead-${email}`,
		email,
		fullName: "Test User",
		companyName: "Acme",
		companyWebsite: "https://acme.com",
		painPoints: null,
		leadSource: null,
		companyResearch: null,
		stage: 0,
		replyStatus: "pending",
		latestMessageId: null,
		linkedinUrl: null,
		messageIds: [],
		lastEmailSentAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	}
}

describe("bulkCaptureLead", () => {
	const mockDeps = {
		leadRepo: {
			findByEmail: vi.fn(),
			create: vi.fn(),
		},
		emailVerifier: {
			verify: vi.fn(),
		},
		optOutRepo: {
			has: vi.fn(),
		},
		logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
	}

	beforeEach(() => {
		vi.clearAllMocks()
		mockDeps.optOutRepo.has.mockResolvedValue(false)
	})

	const baseInput = {
		fullName: "Test User",
		companyName: "Acme",
		companyWebsite: "https://acme.com",
	}

	it("processes all-valid batch", async () => {
		mockDeps.leadRepo.findByEmail.mockResolvedValue(null)
		mockDeps.emailVerifier.verify.mockResolvedValue({ valid: true })
		mockDeps.leadRepo.create.mockImplementation(async (input: any) =>
			makeLead(input.email),
		)

		const bulk = makeBulkCaptureLeadUseCase(mockDeps as any)
		const result = await bulk([
			{ ...baseInput, email: "a@acme.com" },
			{ ...baseInput, email: "b@acme.com" },
		])

		expect(result.created).toHaveLength(2)
		expect(result.duplicates).toHaveLength(0)
		expect(result.invalid).toHaveLength(0)
	})

	it("handles partial-invalid batch", async () => {
		mockDeps.leadRepo.findByEmail.mockResolvedValue(null)
		mockDeps.emailVerifier.verify.mockImplementation(async (email: string) =>
			email.includes("bad")
				? { valid: false, reason: "no MX" }
				: { valid: true },
		)
		mockDeps.leadRepo.create.mockImplementation(async (input: any) =>
			makeLead(input.email),
		)

		const bulk = makeBulkCaptureLeadUseCase(mockDeps as any)
		const result = await bulk([
			{ ...baseInput, email: "good@acme.com" },
			{ ...baseInput, email: "bad@nowhere.tld" },
		])

		expect(result.created).toHaveLength(1)
		expect(result.invalid).toHaveLength(1)
	})

	it("handles all-duplicates batch (DB)", async () => {
		mockDeps.leadRepo.findByEmail.mockImplementation(async (email: string) =>
			makeLead(email),
		)

		const bulk = makeBulkCaptureLeadUseCase(mockDeps as any)
		const result = await bulk([
			{ ...baseInput, email: "a@acme.com" },
			{ ...baseInput, email: "b@acme.com" },
		])

		expect(result.duplicates).toHaveLength(2)
		expect(result.created).toHaveLength(0)
	})

	it("deduplicates within batch itself", async () => {
		mockDeps.leadRepo.findByEmail.mockResolvedValue(null)
		mockDeps.emailVerifier.verify.mockResolvedValue({ valid: true })
		mockDeps.leadRepo.create.mockImplementation(async (input: any) =>
			makeLead(input.email),
		)

		const bulk = makeBulkCaptureLeadUseCase(mockDeps as any)
		const result = await bulk([
			{ ...baseInput, email: "same@acme.com" },
			{ ...baseInput, email: "same@acme.com" },
		])

		expect(result.created).toHaveLength(1)
		expect(result.duplicates).toHaveLength(1)
		expect(result.duplicates[0].reason).toContain("Duplicate within this batch")
	})

	it("returns empty result for empty batch", async () => {
		const bulk = makeBulkCaptureLeadUseCase(mockDeps as any)
		const result = await bulk([])

		expect(result.created).toHaveLength(0)
		expect(result.duplicates).toHaveLength(0)
		expect(result.invalid).toHaveLength(0)
	})
})
