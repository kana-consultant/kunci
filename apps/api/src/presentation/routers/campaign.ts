import { os } from "@orpc/server"
import type { ORPCContext } from "../orpc/context.ts"
import { protectedProcedure } from "../orpc/middleware.ts"

export const campaignRouter = os.$context<ORPCContext>().router({
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
