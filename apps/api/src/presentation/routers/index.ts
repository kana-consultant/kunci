import { os } from "@orpc/server"
import { campaignRouter } from "./campaign.ts"
import { leadRouter } from "./lead.ts"

export const appRouter = os.router({
  lead: leadRouter,
  campaign: campaignRouter,
})

export type AppRouter = typeof appRouter
