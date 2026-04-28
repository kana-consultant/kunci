import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { TanStackRouterVite } from "@tanstack/router-plugin/vite"
import path from "node:path"

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
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		port: 3000,
		proxy: {
			"/rpc": "http://localhost:3001",
			"/webhooks": "http://localhost:3001",
			"/healthz": "http://localhost:3001",
		},
	},
})
