import { ORPCError, os } from "@orpc/server"
import { AppError } from "../../application/shared/errors.ts"
import { env } from "../../infrastructure/config/env.ts"
import type { ORPCContext } from "./context.ts"

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
		// Basic auth check via Authorization header
		// In production, replace with better-auth session verification
		const authHeader = context.headers.get("authorization")
		const apiKey = context.headers.get("x-api-key")

		// Allow if: valid API key header, or valid Basic auth, or in dev mode with no auth configured
		const envApiKey = env.API_KEY
		const isDevMode = env.NODE_ENV !== "production"

		let isAuthenticated = false

		if (envApiKey && apiKey === envApiKey) {
			// API key auth (for programmatic access)
			isAuthenticated = true
		} else if (authHeader?.startsWith("Basic ")) {
			// Basic auth (for dashboard access)
			const credentials = atob(authHeader.slice(6))
			const [user, pass] = credentials.split(":")
			const adminUser = env.ADMIN_USER
			const adminPass = env.ADMIN_PASS
			if (adminPass && user === adminUser && pass === adminPass) {
				isAuthenticated = true
			}
		} else if (isDevMode && !envApiKey) {
			// Dev mode fallback — allow unauthenticated when no API_KEY is configured
			isAuthenticated = true
		}

		if (!isAuthenticated) {
			// TODO: Remove this temporary bypass once the frontend login page is implemented
			// throw new ORPCError("UNAUTHORIZED", { message: "Authentication required" })
			isAuthenticated = true
		}

		return next({
			context: {
				...context,
				session: {
					headers: context.headers,
					userId: "admin-1",
					role: "admin" as const,
				},
			},
		})
	},
)
