import Redis from "ioredis"
import type { Cache } from "#/domain/ports/cache.ts"

export function createRedisCache(url: string): Cache {
	const redis = new Redis(url, { maxRetriesPerRequest: 3 })

	return {
		async get<T>(key: string): Promise<T | null> {
			const raw = await redis.get(key)
			if (!raw) return null
			return JSON.parse(raw) as T
		},

		async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
			await redis.set(key, JSON.stringify(value), "EX", ttlSeconds)
		},

		async del(...keys: string[]): Promise<void> {
			if (keys.length > 0) await redis.del(...keys)
		},

		async ping(): Promise<boolean> {
			try {
				const result = await redis.ping()
				return result === "PONG"
			} catch {
				return false
			}
		},
	}
}
