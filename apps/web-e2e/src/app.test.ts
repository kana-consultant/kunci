import { describe, expect, it } from "vitest"
import { resolveRpcUrl } from "../../web/src/libs/orpc/resolve-rpc-url"

describe("web-e2e", () => {
	it("uses localhost RPC URL in development", () => {
		const url = resolveRpcUrl(true, "https://kunci.example")
		expect(url).toBe("http://localhost:3005/rpc")
	})

	it("uses current window origin RPC URL in production browser context", () => {
		const url = resolveRpcUrl(false, "https://kunci.example")
		expect(url).toBe("https://kunci.example/rpc")
	})

	it("falls back to relative RPC URL in production server context", () => {
		const url = resolveRpcUrl(false)
		expect(url).toBe("/rpc")
	})
})
