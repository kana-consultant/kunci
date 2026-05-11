import { env } from "#/infrastructure/config/env.ts"
import { type CallParams, callOpenRouter } from "./client.ts"

let active = 0
const waiters: Array<() => void> = []

function acquire(): Promise<void> {
	if (active < env.OPENROUTER_MAX_CONCURRENCY) {
		active++
		return Promise.resolve()
	}
	return new Promise<void>((resolve) => {
		waiters.push(resolve)
	})
}

function release(): void {
	const next = waiters.shift()
	if (next) {
		next()
	} else {
		active--
	}
}

export async function callOpenRouterQueued<T>(
	apiKey: string,
	params: CallParams,
	maxRetries?: number,
): Promise<T> {
	await acquire()
	try {
		return await callOpenRouter<T>(apiKey, params, maxRetries)
	} finally {
		release()
	}
}
