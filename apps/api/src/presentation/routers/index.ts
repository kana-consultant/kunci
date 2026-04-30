import { os } from "@orpc/server"
import { campaignRouter } from "./campaign"
import { leadRouter } from "./lead"
import type { ORPCContext } from "../orpc/context"

export const appRouter = os.$context<ORPCContext>().router({
	campaign: campaignRouter,
	lead: leadRouter,
})

export type AppRouter = typeof appRouter
