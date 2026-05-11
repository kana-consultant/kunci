import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	test: {
		environment: "jsdom",
		globals: true,
		include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
		env: {
			DATABASE_URL: "postgres://kunci:kunci_dev@localhost:12501/kunci_dev",
			OPENROUTER_API_KEY: "sk-mock",
			RESEND_API_KEY: "re-mock",
			DEEPCRAWL_API_KEY: "dc-mock",
			SENDER_EMAIL: "noreply@test.com",
			BETTER_AUTH_SECRET: "secret-mock",
			REDIS_URL: "redis://127.0.0.1:27096",
		},
	},
})
