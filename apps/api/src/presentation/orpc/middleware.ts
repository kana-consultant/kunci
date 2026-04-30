import { ORPCError, os } from "@orpc/server"
import { AppError } from "#/application/shared/errors.ts"
import { auth } from "#/infrastructure/auth/better-auth.ts"
import { env } from "#/infrastructure/config/env.ts"
import type { ORPCContext } from "#/presentation/orpc/context.ts"

export const baseos = os.$context<ORPCContext>()

export const publicProcedure = baseos.use(async ({ context, next }) => {
	try {
		return await next({ context })
	} catch (error) {
		if (error instanceof AppError) {
			throw new ORPCError(error.code, { message: error.message })
		}
		throw error
	}
})

export const protectedProcedure = publicProcedure.use(
	async ({ context, next }) => {
		// Get session via better-auth
		const session = await auth.api.getSession({
			headers: context.headers,
		})

		const apiKey = context.headers.get("x-api-key")
		const envApiKey = env.API_KEY
		const isProgrammatic = envApiKey && apiKey === envApiKey

		if (!session && !isProgrammatic) {
			throw new ORPCError("UNAUTHORIZED", { message: "Authentication required" })
		}

		return next({
			context: {
				...context,
				session: session
					? {
							headers: context.headers,
							userId: session.user.id,
							role: session.user.role as "admin" | "user",
						}
					: null, // Handle programmatic access
			},
		})
	},
)
