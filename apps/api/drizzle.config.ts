import { defineConfig } from "drizzle-kit"

const url = process.env.DATABASE_URL
if (!url) throw new Error("DATABASE_URL not set — run: source ../../.env")

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/infrastructure/db/schema.ts",
	out: "./drizzle",
	dbCredentials: { url },
})
