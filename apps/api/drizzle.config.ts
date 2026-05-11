import { defineConfig } from "drizzle-kit"

process.loadEnvFile("../../.env")

const url = process.env.DATABASE_URL
if (!url) throw new Error("DATABASE_URL is not set")

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/infrastructure/db/schema.ts",
	out: "./drizzle",
	dbCredentials: { url },
})
