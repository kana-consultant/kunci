import { describe, expect, it, vi } from "vitest"
import { isReasoningModel } from "./client.ts"

vi.mock("#/infrastructure/observability/logger.ts", () => ({
	logger: {
		warn: vi.fn(),
		debug: vi.fn(),
	},
}))

describe("isReasoningModel", () => {
	it("detects o3-mini", () => {
		expect(isReasoningModel("openai/o3-mini")).toBe(true)
	})

	it("detects o1", () => {
		expect(isReasoningModel("openai/o1")).toBe(true)
	})

	it("detects o3", () => {
		expect(isReasoningModel("openai/o3")).toBe(true)
	})

	it("does not match gpt-4o", () => {
		expect(isReasoningModel("openai/gpt-4o")).toBe(false)
	})

	it("does not match gpt-4.1-mini", () => {
		expect(isReasoningModel("openai/gpt-4.1-mini")).toBe(false)
	})

	it("does not match anthropic models", () => {
		expect(isReasoningModel("anthropic/claude-3-5-sonnet")).toBe(false)
	})
})
