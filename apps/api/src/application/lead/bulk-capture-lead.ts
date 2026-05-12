import type { CreateLeadInput, Lead } from "#/domain/lead/lead.ts"
import type { LeadRepository } from "#/domain/lead/lead-repository.ts"
import type { OptOutRepository } from "#/domain/opt-out/opt-out-repository.ts"
import type { EmailVerifier } from "#/domain/ports/email-verifier.ts"
import type { Logger } from "#/domain/ports/logger.ts"
import { inferLocaleFromEmail } from "./locale-inference.ts"

export interface BulkCaptureResult {
	created: Lead[]
	duplicates: DuplicateEntry[]
	invalid: InvalidEntry[]
	suppressed: SuppressedEntry[]
}

export interface DuplicateEntry {
	email: string
	fullName: string
	reason: string
}

export interface InvalidEntry {
	email: string
	fullName: string
	reason: string
}

export interface SuppressedEntry {
	email: string
	fullName: string
	reason: string
}

interface BulkCaptureLeadDeps {
	leadRepo: LeadRepository
	emailVerifier: EmailVerifier
	optOutRepo: OptOutRepository
	logger: Logger
}

/**
 * Bulk capture leads — processes an array of lead inputs, skipping duplicates
 * and invalid emails. Returns a detailed report of created, duplicate, and
 * invalid entries so the caller can inform the user.
 */
export function makeBulkCaptureLeadUseCase(deps: BulkCaptureLeadDeps) {
	return async (inputs: CreateLeadInput[]): Promise<BulkCaptureResult> => {
		const created: Lead[] = []
		const duplicates: DuplicateEntry[] = []
		const invalid: InvalidEntry[] = []
		const suppressed: SuppressedEntry[] = []

		// Deduplicate within the batch itself (first occurrence wins)
		const seenEmails = new Set<string>()

		for (const input of inputs) {
			const normalizedEmail = input.email.trim().toLowerCase()

			// 1. In-batch duplicate check
			if (seenEmails.has(normalizedEmail)) {
				duplicates.push({
					email: input.email,
					fullName: input.fullName,
					reason: "Duplicate within this batch",
				})
				continue
			}
			seenEmails.add(normalizedEmail)

			// 2. Opt-out / suppression list check (legal)
			if (await deps.optOutRepo.has(normalizedEmail)) {
				suppressed.push({
					email: input.email,
					fullName: input.fullName,
					reason: "Email is on the opt-out list",
				})
				continue
			}

			// 3. Database duplicate check
			const existing = await deps.leadRepo.findByEmail(normalizedEmail)
			if (existing) {
				duplicates.push({
					email: input.email,
					fullName: input.fullName,
					reason: `Already exists (ID: ${existing.id})`,
				})
				continue
			}

			// 4. Email verification via DNS MX
			const verification = await deps.emailVerifier.verify(normalizedEmail)
			if (!verification.valid) {
				invalid.push({
					email: input.email,
					fullName: input.fullName,
					reason: `Invalid email: ${verification.reason}`,
				})
				continue
			}

			// 5. Auto-infer locale from email TLD when caller did not supply one
			const inferred = inferLocaleFromEmail(normalizedEmail)
			const enriched: CreateLeadInput = {
				...input,
				email: normalizedEmail,
				country: input.country ?? inferred.country ?? undefined,
				locale: input.locale ?? inferred.locale ?? undefined,
				language: input.language ?? inferred.language ?? undefined,
				timezone: input.timezone ?? inferred.timezone ?? undefined,
			}

			// 6. Create lead
			try {
				const lead = await deps.leadRepo.create(enriched)
				created.push(lead)
				deps.logger.info(
					{ leadId: lead.id, email: lead.email, country: lead.country },
					"Lead captured (bulk)",
				)
			} catch (error) {
				const msg = error instanceof Error ? error.message : String(error)
				if (msg.includes("unique") || msg.includes("duplicate")) {
					duplicates.push({
						email: input.email,
						fullName: input.fullName,
						reason: "Duplicate (created concurrently)",
					})
				} else {
					invalid.push({
						email: input.email,
						fullName: input.fullName,
						reason: `Creation failed: ${msg}`,
					})
				}
			}
		}

		deps.logger.info(
			{
				created: created.length,
				duplicates: duplicates.length,
				invalid: invalid.length,
				suppressed: suppressed.length,
			},
			"Bulk capture completed",
		)

		return { created, duplicates, invalid, suppressed }
	}
}
