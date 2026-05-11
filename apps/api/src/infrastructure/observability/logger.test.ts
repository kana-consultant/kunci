import { describe, expect, it, vi } from "vitest"

const loggerMocks = vi.hoisted(() => ({
	child: vi.fn(() => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() })),
}))

vi.mock("../config/env.ts", () => ({
	env: { NODE_ENV: "production" },
}))

vi.mock("pino", () => ({
	default: vi.fn(() => ({ child: loggerMocks.child })),
}))

describe("createRequestLogger", () => {
	it("binds requestId to a child logger", async () => {
		const { createRequestLogger } = await import("./logger.ts")

		createRequestLogger("req-123")

		expect(loggerMocks.child).toHaveBeenCalledWith({ requestId: "req-123" })
	})
})
