import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { betterAuth } from "better-auth"
import { env } from "../config/env.ts"
import { db } from "../db/client.ts"
import * as schema from "../db/schema.ts"

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: schema.user,
			session: schema.session,
			account: schema.account,
			verification: schema.verification,
		},
	}),
	emailAndPassword: {
		enabled: true,
	},
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	user: {
		additionalFields: {
			role: {
				type: "string",
				required: false,
				defaultValue: "user",
			},
		},
	},
})
