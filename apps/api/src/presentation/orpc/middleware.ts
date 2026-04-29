import { ORPCError, os } from "@orpc/server"
import { AppError } from "#/application/shared/errors.ts"
import { env } from "../../infrastructure/config/env.ts"
import type { ORPCContext } from "./context.ts"

export const publicProcedure = os
	.$context<ORPCContext>()
	.use(async ({ context, next }) => {
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
			try {
				const credentials = atob(authHeader.slice(6))
				const separator = credentials.indexOf(":")
				if (separator >= 0) {
					const user = credentials.slice(0, separator)
					const pass = credentials.slice(separator + 1)
					const adminUser = env.ADMIN_USER
					const adminPass = env.ADMIN_PASS
					if (adminPass && user === adminUser && pass === adminPass) {
						isAuthenticated = true
					}
				}
			} catch {
				// Invalid base64 or malformed payload: treat as unauthorized
			}
		} else if (isDevMode && !envApiKey) {
			// Dev mode fallback — allow unauthenticated when no API_KEY is configured
			isAuthenticated = true
		}

		if (!isAuthenticated) {
			throw new ORPCError("UNAUTHORIZED", {
				message: "Authentication required",
			})
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
