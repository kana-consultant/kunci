import { z } from "zod"

const envSchema = z
	.object({
		DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
		REDIS_URL: z.string().default("redis://127.0.0.1:27096"),
		OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
		OPENROUTER_MAX_CONCURRENCY: z.coerce.number().int().positive().default(3),
		RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
		RESEND_WEBHOOK_SECRET: z.string().optional(),
		DEEPCRAWL_API_KEY: z.string().min(1, "DEEPCRAWL_API_KEY is required"),
		LINKEDIN_CRAWLING_PERMISSION_CONFIRMED: z
			.enum(["true", "false"])
			.default("false")
			.transform((value) => value === "true"),
		SENDER_EMAIL: z.string().email("SENDER_EMAIL must be a valid email"),
		SENDER_NAME: z.string().default("KUNCI AI SDR"),
		SENDER_COMPANY: z.string().default("KUNCI.AI"),
		PORT: z.coerce.number().int().positive().default(7773),
		WEB_ORIGIN: z.string().url().default("http://localhost:5418"),
		WEB_DIST_PATH: z.string().optional(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
		API_KEY: z.string().optional(),
		ADMIN_USER: z.string().default("admin"),
		ADMIN_PASS: z.string().optional(),
		BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
		BETTER_AUTH_URL: z.string().url().optional(),
		SLACK_WEBHOOK_URL: z.string().url().optional(),
		/** Public origin for unsubscribe links (defaults to API origin built from PORT). */
		PUBLIC_API_URL: z.string().url().optional(),
		/** HMAC secret for unsubscribe tokens. Falls back to BETTER_AUTH_SECRET. */
		UNSUBSCRIBE_SECRET: z.string().min(16).optional(),

		/** BullMQ worker concurrency for the lead-pipeline queue. */
		PIPELINE_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(3),
		/** Max pipeline jobs started in the rolling window below. */
		PIPELINE_RATE_MAX: z.coerce.number().int().positive().default(10),
		/** Rolling window in ms for PIPELINE_RATE_MAX. */
		PIPELINE_RATE_DURATION_MS: z.coerce.number().int().positive().default(1000),
		/** Whether to auto-enqueue captured leads into the pipeline queue. */
		PIPELINE_AUTO_ENQUEUE: z
			.enum(["true", "false"])
			.default("true")
			.transform((value) => value === "true"),

		/** IMAP polling — alternative to Resend Inbound for capturing replies. */
		IMAP_ENABLED: z
			.enum(["true", "false"])
			.default("false")
			.transform((value) => value === "true"),
		IMAP_HOST: z.string().optional(),
		IMAP_PORT: z.coerce.number().int().positive().default(993),
		IMAP_SECURE: z
			.enum(["true", "false"])
			.default("true")
			.transform((value) => value === "true"),
		IMAP_USER: z.string().optional(),
		IMAP_PASSWORD: z.string().optional(),
		IMAP_MAILBOX: z.string().default("INBOX"),
		IMAP_BATCH_SIZE: z.coerce.number().int().positive().default(25),
		IMAP_POLL_INTERVAL_SECONDS: z.coerce.number().int().positive().default(60),

		/** Local-disk root for user-uploaded assets (company profile PDFs, etc.). */
		UPLOAD_DIR: z.string().default("./uploads"),
		/** Max upload bytes per single file (10 MB default; Resend caps email at 40 MB). */
		UPLOAD_MAX_BYTES: z.coerce
			.number()
			.int()
			.positive()
			.default(10 * 1024 * 1024),
	})
	.superRefine((data, ctx) => {
		if (data.NODE_ENV === "production" && !data.RESEND_WEBHOOK_SECRET) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "RESEND_WEBHOOK_SECRET is required in production",
				path: ["RESEND_WEBHOOK_SECRET"],
			})
		}
		if (data.IMAP_ENABLED) {
			for (const field of [
				"IMAP_HOST",
				"IMAP_USER",
				"IMAP_PASSWORD",
			] as const) {
				if (!data[field]) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: `${field} is required when IMAP_ENABLED=true`,
						path: [field],
					})
				}
			}
		}
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
