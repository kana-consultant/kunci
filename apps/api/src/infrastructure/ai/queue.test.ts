import { describe, expect, it, vi } from "vitest"

vi.mock("#/infrastructure/config/env.ts", () => ({
	env: { OPENROUTER_MAX_CONCURRENCY: 3 },
}))

vi.mock("./client.ts", () => ({
	callOpenRouter: vi.fn(),
}))

describe("callOpenRouterQueued — concurrency semaphore", () => {
	it("never exceeds max concurrency of 3 when 10 calls fire simultaneously", async () => {
		const { callOpenRouter } = await import("./client.ts")
		const { callOpenRouterQueued } = await import("./queue.ts")

		let concurrent = 0
		let maxConcurrent = 0

		vi.mocked(callOpenRouter).mockImplementation(async () => {
			concurrent++
			maxConcurrent = Math.max(maxConcurrent, concurrent)
			await new Promise((r) => setTimeout(r, 10))
			concurrent--
			return "ok"
		})

		const calls = Array.from({ length: 10 }, () =>
			callOpenRouterQueued("key", { model: "gpt-4o", messages: [] }),
		)
		await Promise.all(calls)

		expect(maxConcurrent).toBeLessThanOrEqual(3)
	})
})
