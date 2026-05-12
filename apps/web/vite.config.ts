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
	// Read env from both the web app dir and the monorepo root so values like
	// VITE_ALLOWED_HOSTS / VITE_API_URL can live in the shared root .env.
	const rootEnv = loadEnv(mode, path.resolve(__dirname, "../.."), "")
	const localEnv = loadEnv(mode, process.cwd(), "")
	const env = { ...rootEnv, ...localEnv }
	const apiTarget = env.VITE_API_URL || "http://localhost:3005"

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
			port: 5418,
			// Allow tunnelled hosts (ngrok, cloudflared, etc.) by listing them in
			// VITE_ALLOWED_HOSTS as a comma-separated string. Falls back to localhost.
			allowedHosts: env.VITE_ALLOWED_HOSTS
				? env.VITE_ALLOWED_HOSTS.split(",").map((s) => s.trim()).filter(Boolean)
				: ["localhost", "127.0.0.1"],
			proxy: {
				"/rpc": apiTarget,
				"/api/auth": apiTarget,
				"/webhooks": apiTarget,
				"/healthz": apiTarget,
			},
		},
	}
})
