/**
 * Port for caching operations.
 * Implementation: infrastructure/cache/redis.ts
 * Provider: ioredis
 */
export interface Cache {
	get<T>(key: string): Promise<T | null>
	set(key: string, value: unknown, ttlSeconds: number): Promise<void>
	del(...keys: string[]): Promise<void>
	ping(): Promise<boolean>
}
