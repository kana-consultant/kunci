import { asc, eq, desc } from "drizzle-orm"
import type {
	PipelineStep,
	PipelineTracker,
} from "#/domain/ports/pipeline-tracker.ts"
import type { Database } from "../client.ts"
import { pipelineSteps, leads } from "../schema.ts"

export function createPipelineStepRepository(db: Database): PipelineTracker {
	return {
		async startStep(leadId, step, label, detail) {
			const [row] = await db
				.insert(pipelineSteps)
				.values({
					leadId,
					step,
					label,
					status: "running",
					detail: detail ?? null,
				})
				.returning({ id: pipelineSteps.id })

			return row.id
		},

		async completeStep(stepId, detail) {
			const now = new Date()
			const [existing] = await db
				.select({ startedAt: pipelineSteps.startedAt })
				.from(pipelineSteps)
				.where(eq(pipelineSteps.id, stepId))
				.limit(1)

			const durationMs = existing
				? now.getTime() - existing.startedAt.getTime()
				: null

			const { leadId, ...restDetail } = detail ?? {}
			const hasDetail = Object.keys(restDetail).length > 0

			await db
				.update(pipelineSteps)
				.set({
					status: "completed",
					durationMs,
					completedAt: now,
					...(leadId ? { leadId: leadId as string } : {}),
					...(hasDetail ? { detail: restDetail } : {}),
				})
				.where(eq(pipelineSteps.id, stepId))
		},

		async failStep(stepId, error, detail) {
			const now = new Date()
			const [existing] = await db
				.select({ startedAt: pipelineSteps.startedAt })
				.from(pipelineSteps)
				.where(eq(pipelineSteps.id, stepId))
				.limit(1)

			const durationMs = existing
				? now.getTime() - existing.startedAt.getTime()
				: null

			await db
				.update(pipelineSteps)
				.set({
					status: "failed",
					durationMs,
					completedAt: now,
					detail: { error, ...(detail ?? {}) },
				})
				.where(eq(pipelineSteps.id, stepId))
		},

		async getStepsForLead(leadId) {
			const rows = await db
				.select()
				.from(pipelineSteps)
				.where(eq(pipelineSteps.leadId, leadId))
				.orderBy(asc(pipelineSteps.startedAt))

			return rows.map((r) => ({
				id: r.id,
				leadId: r.leadId,
				step: r.step,
				label: r.label,
				status: r.status as PipelineStep["status"],
				durationMs: r.durationMs,
				detail: r.detail as Record<string, unknown> | null,
				startedAt: r.startedAt,
				completedAt: r.completedAt,
			}))
		},

		async getRecentActivity(limit) {
			const rows = await db
				.select({
					step: pipelineSteps,
					leadName: leads.fullName,
				})
				.from(pipelineSteps)
				.leftJoin(leads, eq(pipelineSteps.leadId, leads.id))
				.orderBy(desc(pipelineSteps.startedAt))
				.limit(limit)

			return rows.map((r) => ({
				id: r.step.id,
				leadId: r.step.leadId,
				step: r.step.step,
				label: r.step.label,
				status: r.step.status as PipelineStep["status"],
				durationMs: r.step.durationMs,
				detail: r.step.detail as Record<string, unknown> | null,
				startedAt: r.step.startedAt,
				completedAt: r.step.completedAt,
				leadName: r.leadName,
			}))
		},
	}
}
