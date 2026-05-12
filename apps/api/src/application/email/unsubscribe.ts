import { createHmac, timingSafeEqual } from "node:crypto"
import { badRequest, notFound } from "#/application/shared/errors.ts"
import type { LeadRepository } from "#/domain/lead/lead-repository.ts"
import type { OptOutSource } from "#/domain/opt-out/opt-out.ts"
import type { OptOutRepository } from "#/domain/opt-out/opt-out-repository.ts"
import type { Logger } from "#/domain/ports/logger.ts"

export interface UnsubscribeConfig {
	/** Public base URL where the API serves `/unsubscribe/:token` */
	baseUrl: string
	/** HMAC secret for token generation. Must be stable across deploys. */
	secret: string
}

interface Deps {
	leadRepo: LeadRepository
	optOutRepo: OptOutRepository
	logger: Logger
	config: UnsubscribeConfig
}

/** Build a deterministic unsubscribe URL for an email address. */
export function makeUnsubscribeUrlBuilder(deps: Pick<Deps, "config">) {
	return (email: string): string => {
		const normalized = email.trim().toLowerCase()
		const token = generateToken(normalized, deps.config.secret)
		const e = Buffer.from(normalized).toString("base64url")
		const base = deps.config.baseUrl.replace(/\/$/, "")
		return `${base}/unsubscribe/${token}?e=${e}`
	}
}

/** Register an opt-out triggered by a token+email pair from the public link. */
export function makeUnsubscribeByTokenUseCase(deps: Deps) {
	return async (params: {
		token: string
		encodedEmail: string
		reason?: string
	}) => {
		const email = decodeEmail(params.encodedEmail)
		if (!email) throw badRequest("Invalid unsubscribe link")

		if (!verifyToken(email, params.token, deps.config.secret)) {
			throw badRequest("Invalid unsubscribe token")
		}

		await deps.optOutRepo.create({
			email,
			token: params.token,
			reason: params.reason ?? null,
			source: "unsubscribe_link",
		})

		const lead = await deps.leadRepo.findByEmail(email)
		if (lead) {
			await deps.leadRepo.update(lead.id, {
				replyStatus: "opted_out",
				completedReason: "opted_out",
			})
		}

		deps.logger.info({ email }, "Lead opted out via unsubscribe link")

		return { email }
	}
}

/** Manually register an opt-out (e.g. from reply classification, admin). */
export function makeRegisterOptOutUseCase(deps: Deps) {
	return async (params: {
		email: string
		reason?: string | null
		source: OptOutSource
	}) => {
		const email = params.email.trim().toLowerCase()
		const token = generateToken(email, deps.config.secret)
		await deps.optOutRepo.create({
			email,
			token,
			reason: params.reason ?? null,
			source: params.source,
		})

		const lead = await deps.leadRepo.findByEmail(email)
		if (lead) {
			await deps.leadRepo.update(lead.id, {
				replyStatus: "opted_out",
				completedReason: "opted_out",
			})
		}

		deps.logger.info({ email, source: params.source }, "Opt-out registered")
	}
}

export function makeCheckOptOutUseCase(deps: Pick<Deps, "optOutRepo">) {
	return async (email: string): Promise<boolean> => {
		return deps.optOutRepo.has(email)
	}
}

export function makeGetOptOutByTokenUseCase(deps: Deps) {
	return async (token: string) => {
		const optOut = await deps.optOutRepo.findByToken(token)
		if (!optOut) throw notFound("Opt-out record not found")
		return optOut
	}
}

// ── Token internals ──────────────────────────────────────────────────────────

function generateToken(email: string, secret: string): string {
	return createHmac("sha256", secret)
		.update(email)
		.digest("base64url")
		.slice(0, 32)
}

function verifyToken(email: string, token: string, secret: string): boolean {
	const expected = generateToken(email, secret)
	if (expected.length !== token.length) return false
	try {
		return timingSafeEqual(Buffer.from(expected), Buffer.from(token))
	} catch {
		return false
	}
}

function decodeEmail(encoded: string): string | null {
	try {
		const decoded = Buffer.from(encoded, "base64url").toString("utf-8")
		if (!decoded.includes("@")) return null
		return decoded.trim().toLowerCase()
	} catch {
		return null
	}
}
