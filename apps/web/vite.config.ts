import { readFileSync } from "node:fs"
import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import { TanStackRouterVite } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

const rootPkg = JSON.parse(
	readFileSync(path.resolve(__dirname, "../../package.json"), "utf-8"),
)

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "")
	const apiTarget = env.VITE_API_URL || "http://localhost:3001"

	return {
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
			port: 3000,
			proxy: {
				"/rpc": apiTarget,
				"/api/auth": apiTarget,
				"/webhooks": apiTarget,
				"/healthz": apiTarget,
			},
		},
	}
})
