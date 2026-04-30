import type { Lead } from "#/domain/lead/lead.ts"
import type { LeadRepository } from "#/domain/lead/lead-repository.ts"
import type { Logger } from "#/domain/ports/logger.ts"

interface SchedulerDeps {
  leadRepo: LeadRepository
  sendFollowup: (lead: Lead) => Promise<void>
  logger: Logger
}

export function makeProcessPendingFollowupsUseCase(deps: SchedulerDeps) {
  return async (): Promise<{ processed: number; errors: number }> => {
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)

    const leads = await deps.leadRepo.findPendingFollowups({
      replyStatus: "awaiting",
      maxStage: 2,
      lastEmailBefore: fourDaysAgo,
    })

    deps.logger.info({ count: leads.length }, "Processing pending follow-ups")

    let processed = 0
    let errors = 0

    for (const lead of leads) {
      try {
        await deps.sendFollowup(lead)
        processed++
      } catch (error) {
        errors++
        deps.logger.error(
          { leadId: lead.id, error },
          "Follow-up processing failed",
        )
      }
    }

    deps.logger.info({ processed, errors }, "Follow-up processing complete")
    return { processed, errors }
  }
}
