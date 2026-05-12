import { eq, sql } from "drizzle-orm"
import type { OptOut } from "#/domain/opt-out/opt-out.ts"
import type {
	CreateOptOutInput,
	OptOutRepository,
} from "#/domain/opt-out/opt-out-repository.ts"
import type { Database } from "#/infrastructure/db/client.ts"
import { optOuts } from "#/infrastructure/db/schema.ts"

export function createOptOutRepository(db: Database): OptOutRepository {
	return {
		async create(input: CreateOptOutInput): Promise<OptOut> {
			const normalized = input.email.trim().toLowerCase()
			const [row] = await db
				.insert(optOuts)
				.values({
					email: normalized,
					token: input.token,
					reason: input.reason ?? null,
					source: input.source ?? "unsubscribe_link",
				})
				.onConflictDoUpdate({
					target: optOuts.email,
					set: {
						token: input.token,
						reason: input.reason ?? null,
						source: input.source ?? "unsubscribe_link",
						optedOutAt: new Date(),
					},
				})
				.returning()
			return mapRow(row)
		},

		async findByEmail(email: string) {
			const [row] = await db
				.select()
				.from(optOuts)
				.where(eq(optOuts.email, email.trim().toLowerCase()))
				.limit(1)
			return row ? mapRow(row) : null
		},

		async findByToken(token: string) {
			const [row] = await db
				.select()
				.from(optOuts)
				.where(eq(optOuts.token, token))
				.limit(1)
			return row ? mapRow(row) : null
		},

		async has(email: string) {
			const [row] = await db
				.select({ exists: sql<number>`1` })
				.from(optOuts)
				.where(eq(optOuts.email, email.trim().toLowerCase()))
				.limit(1)
			return Boolean(row)
		},
	}
}

function mapRow(row: any): OptOut {
	return {
		email: row.email,
		token: row.token,
		reason: row.reason ?? null,
		source: row.source,
		optedOutAt: row.optedOutAt,
	}
}
