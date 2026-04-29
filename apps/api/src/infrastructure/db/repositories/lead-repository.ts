import { and, eq, lte, ne, sql } from "drizzle-orm"
import type { CreateLeadInput, Lead } from "#/domain/lead/lead.ts"
import type {
	LeadRepository,
	ListLeadsParams,
	PendingFollowupsParams,
	UpdateLeadData,
} from "#/domain/lead/lead-repository.ts"
import type { Database } from "#/infrastructure/db/client.ts"
import { leads } from "#/infrastructure/db/schema.ts"

export function createLeadRepository(db: Database): LeadRepository {
	return {
		async create(input: CreateLeadInput): Promise<Lead> {
			const [row] = await db
				.insert(leads)
				.values({
					fullName: input.fullName,
					email: input.email,
					companyName: input.companyName,
					companyWebsite: input.companyWebsite,
					painPoints: input.painPoints ?? null,
					leadSource: input.leadSource ?? null,
				})
				.returning()

			return mapRowToLead(row)
		},

		async findById(id: string): Promise<Lead | null> {
			const [row] = await db
				.select()
				.from(leads)
				.where(eq(leads.id, id))
				.limit(1)

			return row ? mapRowToLead(row) : null
		},

		async findByEmail(email: string): Promise<Lead | null> {
			const [row] = await db
				.select()
				.from(leads)
				.where(eq(leads.email, email))
				.limit(1)

			return row ? mapRowToLead(row) : null
		},

		async list(params: ListLeadsParams) {
			const offset = (params.page - 1) * params.limit
			const conditions = []

			if (params.stage !== undefined) {
				conditions.push(eq(leads.stage, params.stage))
			}
			if (params.status) {
				conditions.push(eq(leads.replyStatus, params.status))
			}

			const where = conditions.length > 0 ? and(...conditions) : undefined

			const [rows, countResult] = await Promise.all([
				db
					.select()
					.from(leads)
					.where(where)
					.orderBy(leads.createdAt)
					.limit(params.limit)
					.offset(offset),
				db
					.select({ count: sql<number>`count(*)::int` })
					.from(leads)
					.where(where),
			])

			return {
				leads: rows.map(mapRowToLead),
				total: countResult[0]?.count ?? 0,
			}
		},

		async update(id: string, data: Partial<UpdateLeadData>): Promise<Lead> {
			const [row] = await db
				.update(leads)
				.set({
					...(data.stage !== undefined ? { stage: data.stage } : {}),
					...(data.replyStatus ? { replyStatus: data.replyStatus } : {}),
					...(data.companyResearch
						? { companyResearch: data.companyResearch }
						: {}),
					...(data.latestMessageId
						? { latestMessageId: data.latestMessageId }
						: {}),
					...(data.messageIds ? { messageIds: data.messageIds } : {}),
					...(data.lastEmailSentAt
						? { lastEmailSentAt: data.lastEmailSentAt }
						: {}),
					updatedAt: new Date(),
				})
				.where(eq(leads.id, id))
				.returning()

			return mapRowToLead(row)
		},

		async findPendingFollowups(
			params: PendingFollowupsParams,
		): Promise<Lead[]> {
			const rows = await db
				.select()
				.from(leads)
				.where(
					and(
						eq(leads.replyStatus, params.replyStatus),
						lte(leads.stage, params.maxStage),
						lte(leads.lastEmailSentAt, params.lastEmailBefore),
						ne(leads.replyStatus, "bounced"),
					),
				)

			return rows.map(mapRowToLead)
		},

		async getStats() {
			const [total, sent, awaiting, replied, bounced] = await Promise.all([
				db
					.select({ count: sql<number>`count(*)::int` })
					.from(leads)
					.then((r) => r[0]?.count ?? 0),
				db
					.select({ count: sql<number>`count(*)::int` })
					.from(leads)
					.where(ne(leads.stage, 0))
					.then((r) => r[0]?.count ?? 0),
				db
					.select({ count: sql<number>`count(*)::int` })
					.from(leads)
					.where(eq(leads.replyStatus, "awaiting"))
					.then((r) => r[0]?.count ?? 0),
				db
					.select({ count: sql<number>`count(*)::int` })
					.from(leads)
					.where(eq(leads.replyStatus, "replied"))
					.then((r) => r[0]?.count ?? 0),
				db
					.select({ count: sql<number>`count(*)::int` })
					.from(leads)
					.where(eq(leads.replyStatus, "bounced"))
					.then((r) => r[0]?.count ?? 0),
			])

			return { total, sent, awaiting, replied, bounced }
		},
	}
}

function mapRowToLead(row: any): Lead {
	return {
		id: row.id,
		fullName: row.fullName,
		email: row.email,
		companyName: row.companyName,
		companyWebsite: row.companyWebsite,
		painPoints: row.painPoints,
		leadSource: row.leadSource,
		companyResearch: row.companyResearch,
		stage: row.stage as Lead["stage"],
		replyStatus: row.replyStatus as Lead["replyStatus"],
		latestMessageId: row.latestMessageId,
		messageIds: row.messageIds ?? [],
		lastEmailSentAt: row.lastEmailSentAt,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	}
}
