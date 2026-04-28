import { z } from "zod"

const envSchema = z.object({
	DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
	REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
	OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
	RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
	RESEND_WEBHOOK_SECRET: z.string().optional(),
	DEEPCRAWL_API_KEY: z.string().min(1, "DEEPCRAWL_API_KEY is required"),
	SENDER_EMAIL: z.string().email("SENDER_EMAIL must be a valid email"),
	SENDER_NAME: z.string().default("KUNCI AI SDR"),
	PORT: z.coerce.number().int().positive().default(3001),
	WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
	WEB_DIST_PATH: z.string().optional(),
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
})

export type Env = z.infer<typeof envSchema>

export function loadEnv(): Env {
	const result = envSchema.safeParse(process.env)

	if (!result.success) {
		const issues = result.error.issues
			.map((i) => `  - ${i.path.join(".")}: ${i.message}`)
			.join("\n")
		throw new Error(`Environment validation failed:\n${issues}`)
	}

	return result.data
}

export const env = loadEnv()
