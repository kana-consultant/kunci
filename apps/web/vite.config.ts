import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { TanStackRouterVite } from "@tanstack/router-plugin/vite"
import path from "node:path"
import { readFileSync } from "node:fs"

const rootPkg = JSON.parse(
	readFileSync(path.resolve(__dirname, "../../package.json"), "utf-8"),
)

export default defineConfig({
	plugins: [
		TanStackRouterVite({
			autoCodeSplitting: true,
			routesDirectory: "./src/routes",
			generatedRouteTree: "./src/routeTree.gen.ts",
		}),
		react(),
		tailwindcss(),
	],
	define: {
		__APP_VERSION__: JSON.stringify(rootPkg.version),
	},
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		port: 8020,
		proxy: {
			"/rpc": "http://localhost:8021",
			"/webhooks": "http://localhost:8021",
			"/healthz": "http://localhost:8021",
		},
	},
})
