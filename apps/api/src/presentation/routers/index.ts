import { os } from "@orpc/server"
import type { ORPCContext } from "#/presentation/orpc/context"
import { campaignRouter } from "#/presentation/routers/campaign"
import { leadRouter } from "#/presentation/routers/lead"

export const appRouter = os.$context<ORPCContext>().router({
	campaign: campaignRouter,
	lead: leadRouter,
})

export type AppRouter = typeof appRouter
