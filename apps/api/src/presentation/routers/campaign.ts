import { os } from "@orpc/server"
import { z } from "zod"
import type { ORPCContext } from "#/presentation/orpc/context"
import { protectedProcedure } from "#/presentation/orpc/middleware"

export const campaignRouter = os.$context<ORPCContext>().router({
	getStats: protectedProcedure
		.input(
			z
				.object({
					period: z.enum(["7d", "30d", "all"]).default("all"),
				})
				.optional(),
		)
		.output(
			z.object({
				totalLeads: z.number(),
				replied: z.number(),
				awaiting: z.number(),
				conversionRate: z.number(),
				bounced: z.number(),
				pending: z.number(),
				researching: z.number(),
				researchFailed: z.number(),
			}),
		)
		.handler(async ({ input, context }) => {
			const stats = await context.useCases.lead.getStats(input?.period)
			const conversionRate =
				stats.total > 0 ? (stats.replied / stats.total) * 100 : 0

			return {
				totalLeads: stats.total,
				replied: stats.replied,
				awaiting: stats.awaiting,
				conversionRate: Number(conversionRate.toFixed(1)),
				bounced: stats.bounced,
				pending: stats.pending,
				researching: stats.researching,
				researchFailed: stats.researchFailed,
			}
		}),

	getStageDistribution: protectedProcedure
		.input(
			z
				.object({
					period: z.enum(["7d", "30d", "all"]).default("all"),
				})
				.optional(),
		)
		.output(
			z.array(
				z.object({
					stage: z.number(),
					count: z.number(),
				}),
			),
		)
		.handler(async ({ input, context }) => {
			return context.useCases.lead.getStageDistribution(input?.period)
		}),

	getRecentActivity: protectedProcedure
		.input(z.object({ limit: z.number().default(10) }).optional())
		.output(
			z.array(
				z.object({
					id: z.string(),
					leadId: z.string().nullable(),
					leadName: z.string().nullable(),
					step: z.string(),
					label: z.string(),
					status: z.string(),
					durationMs: z.number().nullable(),
					startedAt: z.any(),
					completedAt: z.any().nullable(),
				}),
			),
		)
		.handler(async ({ input, context }) => {
			return context.useCases.lead.getRecentActivity(input?.limit ?? 10)
		}),
})
