import { readFileSync } from "node:fs"
import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import { TanStackRouterVite } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

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
			"/rpc": "http://localhost:3005",
			"/webhooks": "http://localhost:3005",
			"/healthz": "http://localhost:3005",
		},
	},
})
