import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "drizzle-kit"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load root .env before Zod validation in env.ts fires
try {
	const lines = readFileSync(resolve(__dirname, "../../.env"), "utf-8").split("\n")
	for (const line of lines) {
		const t = line.trim()
		if (!t || t.startsWith("#")) continue
		const eq = t.indexOf("=")
		if (eq < 0) continue
		const key = t.slice(0, eq).trim()
		const val = t.slice(eq + 1).trim().replace(/^(['"])(.*)\1$/, "$2")
		if (key && !(key in process.env)) process.env[key] = val
	}
} catch {}

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error("DATABASE_URL missing in .env")

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/infrastructure/db/schema.ts",
	out: "./drizzle",
	dbCredentials: {
		url: DATABASE_URL,
	},
})
