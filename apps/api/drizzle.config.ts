import { defineConfig } from "drizzle-kit"
import { env } from "./src/infrastructure/config/env.ts"

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/infrastructure/db/schema.ts",
	out: "./drizzle",
	dbCredentials: {
		url: env.DATABASE_URL,
	},
})
