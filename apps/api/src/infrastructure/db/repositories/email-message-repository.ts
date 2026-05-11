import { eq, sql } from "drizzle-orm"
import type {
	CreateEmailMessageInput,
	EmailMessage,
	MessageDirection,
	ReplyIntent,
} from "#/domain/email-message/email-message.ts"
import type { EmailMessageRepository } from "#/domain/email-message/email-message-repository.ts"
import type { Database } from "#/infrastructure/db/client.ts"
import { emailMessages } from "#/infrastructure/db/schema.ts"

export function createEmailMessageRepository(
	db: Database,
): EmailMessageRepository {
	return {
		async append(input: CreateEmailMessageInput): Promise<EmailMessage> {
			const [row] = await db
				.insert(emailMessages)
				.values({
					leadId: input.leadId,
					direction: input.direction,
					subject: input.subject,
					textBody: input.textBody,
					htmlBody: input.htmlBody ?? null,
					messageId: input.messageId ?? null,
					inReplyTo: input.inReplyTo ?? null,
					intent: input.intent ?? null,
				})
				.returning()

			return mapRow(row)
		},

		async listByLeadId(leadId: string): Promise<EmailMessage[]> {
			const rows = await db
				.select()
				.from(emailMessages)
				.where(eq(emailMessages.leadId, leadId))
				.orderBy(emailMessages.createdAt)

			return rows.map(mapRow)
		},

		async countOutbound(leadId: string): Promise<number> {
			const [row] = await db
				.select({ count: sql<number>`count(*)::int` })
				.from(emailMessages)
				.where(
					sql`${emailMessages.leadId} = ${leadId} AND ${emailMessages.direction} = 'outbound'`,
				)

			return row?.count ?? 0
		},
	}
}

function mapRow(row: any): EmailMessage {
	return {
		id: row.id,
		leadId: row.leadId,
		direction: row.direction as MessageDirection,
		subject: row.subject,
		textBody: row.textBody,
		htmlBody: row.htmlBody,
		messageId: row.messageId,
		inReplyTo: row.inReplyTo,
		intent: row.intent as ReplyIntent | null,
		createdAt: row.createdAt,
	}
}
