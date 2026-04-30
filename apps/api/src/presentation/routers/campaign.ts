import { os } from "@orpc/server"
import { z } from "zod"
import type { ORPCContext } from "#/presentation/orpc/context"
import { protectedProcedure } from "#/presentation/orpc/middleware"

export const campaignRouter = os.$context<ORPCContext>().router({
	getStats: protectedProcedure
		.output(
			z.object({
				totalLeads: z.number(),
				replied: z.number(),
				awaiting: z.number(),
				conversionRate: z.number(),
			}),
		)
		.handler(async ({ context }) => {
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
