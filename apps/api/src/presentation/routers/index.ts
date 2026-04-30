import { os } from "@orpc/server"
import type { ORPCContext } from "../orpc/context.ts"
import { campaignRouter } from "./campaign.ts"
import { leadRouter } from "./lead.ts"

export const appRouter = os.$context<ORPCContext>().router({
	lead: leadRouter,
	campaign: campaignRouter,
})

export type AppRouter = typeof appRouter
