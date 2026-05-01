import { os } from "@orpc/server"
import type { ORPCContext } from "#/presentation/orpc/context"
import { campaignRouter } from "#/presentation/routers/campaign"
import { leadRouter } from "#/presentation/routers/lead"
import { sandboxRouter } from "#/presentation/routers/sandbox.ts"
import { settingsRouter } from "#/presentation/routers/settings.ts"

export const appRouter = os.$context<ORPCContext>().router({
	campaign: campaignRouter,
	lead: leadRouter,
	settings: settingsRouter,
	sandbox: sandboxRouter,
})

export type AppRouter = typeof appRouter
