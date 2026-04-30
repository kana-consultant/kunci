import { os } from "@orpc/server"
import { protectedProcedure } from "../orpc/middleware.ts"

export const campaignRouter = os.router({
  // @ts-expect-error - oRPC constraint mismatch
  getStats: protectedProcedure.handler(async ({ context }) => {
    const stats = await context.useCases.lead.getStats()
    const conversionRate =
      stats.total > 0 ? (stats.replied / stats.total) * 100 : 0

    return {
      totalLeads: stats.total,
      replied: stats.replied,
      awaiting: stats.sent - stats.replied,
      conversionRate: Number(conversionRate.toFixed(1)),
    }
  }),
})
