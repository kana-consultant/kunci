/**
 * Port for tracking pipeline execution steps.
 * Each step represents a discrete operation in the outbound pipeline.
 */
export interface PipelineStep {
  id: string
  leadId: string | null
  step: string
  label: string
  status: "running" | "completed" | "failed"
  durationMs: number | null
  detail: Record<string, unknown> | null
  startedAt: Date
  completedAt: Date | null
}

export interface PipelineTracker {
  /** Start a new step — returns the step ID so it can be completed/failed later */
  startStep(
    leadId: string | null,
    step: string,
    label: string,
    detail?: Record<string, unknown>,
  ): Promise<string>

  /** Mark a step as completed, recording duration */
  completeStep(stepId: string, detail?: Record<string, unknown>): Promise<void>

  /** Mark a step as failed, recording error info */
  failStep(
    stepId: string,
    error: string,
    detail?: Record<string, unknown>,
  ): Promise<void>

  /** Get all steps for a lead, ordered by startedAt ascending */
  getStepsForLead(leadId: string): Promise<PipelineStep[]>
}
