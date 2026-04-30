import { and, eq } from "drizzle-orm"
import type {
  CreateEmailSequenceInput,
  EmailSequence,
} from "#/domain/email-sequence/email-sequence.ts"
import type { EmailSequenceRepository } from "#/domain/email-sequence/email-sequence-repository.ts"
import type { Database } from "#/infrastructure/db/client.ts"
import { emailSequences } from "#/infrastructure/db/schema.ts"

export function createEmailSequenceRepository(
  db: Database,
): EmailSequenceRepository {
  return {
    async saveAll(
      leadId: string,
      sequences: CreateEmailSequenceInput[],
    ): Promise<EmailSequence[]> {
      const rows = await db
        .insert(emailSequences)
        .values(
          sequences.map((s) => ({
            leadId,
            emailNumber: s.emailNumber,
            subjectLines: s.subjectLines,
            content: s.content,
            cta: s.cta,
            psychologicalTrigger: s.psychologicalTrigger,
          })),
        )
        .returning()

      return rows.map(mapRow)
    },

    async findByLeadId(leadId: string): Promise<EmailSequence[]> {
      const rows = await db
        .select()
        .from(emailSequences)
        .where(eq(emailSequences.leadId, leadId))
        .orderBy(emailSequences.emailNumber)

      return rows.map(mapRow)
    },

    async getByStage(
      leadId: string,
      emailNumber: 1 | 2 | 3,
    ): Promise<EmailSequence | null> {
      const [row] = await db
        .select()
        .from(emailSequences)
        .where(
          and(
            eq(emailSequences.leadId, leadId),
            eq(emailSequences.emailNumber, emailNumber),
          ),
        )
        .limit(1)

      return row ? mapRow(row) : null
    },

    async updateHtml(id: string, htmlContent: string): Promise<void> {
      await db
        .update(emailSequences)
        .set({ htmlContent })
        .where(eq(emailSequences.id, id))
    },

    async markSent(id: string): Promise<void> {
      await db
        .update(emailSequences)
        .set({ sentAt: new Date() })
        .where(eq(emailSequences.id, id))
    },
  }
}

function mapRow(row: any): EmailSequence {
  return {
    id: row.id,
    leadId: row.leadId,
    emailNumber: row.emailNumber as EmailSequence["emailNumber"],
    subjectLines: row.subjectLines ?? [],
    content: row.content,
    htmlContent: row.htmlContent,
    cta: row.cta,
    psychologicalTrigger: row.psychologicalTrigger,
    sentAt: row.sentAt,
    createdAt: row.createdAt,
  }
}
