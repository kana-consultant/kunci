import { os } from "@orpc/server"
import { leadRouter } from "./lead.ts"
import { campaignRouter } from "./campaign.ts"

export const appRouter = os.router({
	lead: leadRouter,
	campaign: campaignRouter,
})

export type AppRouter = typeof appRouter
