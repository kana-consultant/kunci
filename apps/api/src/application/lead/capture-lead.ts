import { badRequest, conflict } from "#/application/shared/errors.ts"
import type { CreateLeadInput, Lead } from "#/domain/lead/lead.ts"
import type { LeadRepository } from "#/domain/lead/lead-repository.ts"
import type { EmailVerifier } from "#/domain/ports/email-verifier.ts"
import type { Logger } from "#/domain/ports/logger.ts"

interface CaptureLeadDeps {
  leadRepo: LeadRepository
  emailVerifier: EmailVerifier
  logger: Logger
}

export function makeCaptureLeadUseCase(deps: CaptureLeadDeps) {
  return async (input: CreateLeadInput): Promise<Lead> => {
    // 1. Check duplicate
    const existing = await deps.leadRepo.findByEmail(input.email)
    if (existing) {
      throw conflict(`Lead with email ${input.email} already exists`)
    }

    // 2. Verify email via DNS MX
    const verification = await deps.emailVerifier.verify(input.email)
    if (!verification.valid) {
      throw badRequest(`Invalid email: ${verification.reason}`)
    }

    // 3. Create lead
    const lead = await deps.leadRepo.create(input)
    deps.logger.info({ leadId: lead.id, email: lead.email }, "Lead captured")

    return lead
  }
}

export function makeListLeadsUseCase(deps: { leadRepo: LeadRepository }) {
  return async (params: {
    page: number
    limit: number
    stage?: number
    status?: string
  }) => {
    return deps.leadRepo.list({
      page: params.page,
      limit: params.limit,
      stage: params.stage as Lead["stage"],
      status: params.status as Lead["replyStatus"],
    })
  }
}

export function makeGetLeadDetailUseCase(deps: { leadRepo: LeadRepository }) {
  return async (id: string) => {
    const lead = await deps.leadRepo.findById(id)
    if (!lead) throw badRequest(`Lead not found: ${id}`)
    return lead
  }
}
