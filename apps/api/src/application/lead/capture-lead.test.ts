import { beforeEach, describe, expect, it, vi } from "vitest"
import { makeCaptureLeadUseCase } from "./capture-lead.ts"

const mockLead = {
	id: "lead-1",
	email: "john@acme.com",
	fullName: "John Doe",
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

describe("captureLead", () => {
	const mockDeps = {
		leadRepo: {
			findByEmail: vi.fn(),
			create: vi.fn(),
		},
		emailVerifier: {
			verify: vi.fn(),
		},
		logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
	}

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("creates lead on valid input", async () => {
		mockDeps.leadRepo.findByEmail.mockResolvedValue(null)
		mockDeps.emailVerifier.verify.mockResolvedValue({ valid: true })
		mockDeps.leadRepo.create.mockResolvedValue(mockLead)

		const captureLead = makeCaptureLeadUseCase(mockDeps as any)
		const result = await captureLead({
			fullName: "John Doe",
			email: "john@acme.com",
			companyName: "Acme",
			companyWebsite: "https://acme.com",
		})

		expect(result.id).toBe("lead-1")
		expect(mockDeps.leadRepo.create).toHaveBeenCalledOnce()
	})

	it("throws CONFLICT on duplicate email", async () => {
		mockDeps.leadRepo.findByEmail.mockResolvedValue(mockLead)

		const captureLead = makeCaptureLeadUseCase(mockDeps as any)
		await expect(
			captureLead({
				fullName: "John Doe",
				email: "john@acme.com",
				companyName: "Acme",
				companyWebsite: "https://acme.com",
			}),
		).rejects.toMatchObject({ code: "CONFLICT" })
	})

	it("throws BAD_REQUEST on invalid MX", async () => {
		mockDeps.leadRepo.findByEmail.mockResolvedValue(null)
		mockDeps.emailVerifier.verify.mockResolvedValue({
			valid: false,
			reason: "no MX record",
		})

		const captureLead = makeCaptureLeadUseCase(mockDeps as any)
		await expect(
			captureLead({
				fullName: "John Doe",
				email: "john@invalid.tld",
				companyName: "Acme",
				companyWebsite: "https://acme.com",
			}),
		).rejects.toMatchObject({ code: "BAD_REQUEST" })
	})

	it("emits notification on invalid email when notifier provided", async () => {
		const notifier = { send: vi.fn().mockResolvedValue(undefined) }
		mockDeps.leadRepo.findByEmail.mockResolvedValue(null)
		mockDeps.emailVerifier.verify.mockResolvedValue({
			valid: false,
			reason: "no MX record",
		})

		const captureLead = makeCaptureLeadUseCase({
			...mockDeps,
			notifier,
		} as any)

		await expect(
			captureLead({
				fullName: "John Doe",
				email: "john@bad.tld",
				companyName: "Acme",
				companyWebsite: "https://acme.com",
			}),
		).rejects.toMatchObject({ code: "BAD_REQUEST" })

		// Allow microtask to fire
		await Promise.resolve()
		expect(notifier.send).toHaveBeenCalledWith(
			expect.objectContaining({ type: "lead.email_invalid" }),
		)
	})
})
