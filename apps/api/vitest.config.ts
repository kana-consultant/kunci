import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { defineConfig } from "vitest/config"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
	resolve: {
		alias: [
			{
				find: /^#\/(.*)/,
				replacement: resolve(__dirname, "src/$1"),
			},
		],
	},
})
