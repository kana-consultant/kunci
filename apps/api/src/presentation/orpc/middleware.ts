import { os, ORPCError } from "@orpc/server"
import { AppError } from "#/application/shared/errors.ts"
import type { ORPCContext } from "./context.ts"

export const publicProcedure = os.$context<ORPCContext>().use(async ({ context, next }) => {
	try {
		return await next({ context })
	} catch (error) {
		if (error instanceof AppError) {
			throw new ORPCError(error.code, { message: error.message })
		}
		throw error
	}
})

export const protectedProcedure = publicProcedure.use(async ({ context, next }) => {
	// For V1 (internal tool), we can mock authentication or implement simple basic auth
	// Future: integrate better-auth here
	const isAuthenticated = true // Mocked for now

	if (!isAuthenticated) {
		throw new ORPCError("UNAUTHORIZED", { message: "Authentication required" })
	}

	return next({
		context: {
			...context,
			session: {
				headers: context.headers,
				userId: "admin-1",
				role: "admin",
			},
		},
	})
})
