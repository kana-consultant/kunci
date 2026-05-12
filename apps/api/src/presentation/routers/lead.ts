import { os } from "@orpc/server"
import { z } from "zod"
import { badRequest } from "#/application/shared/errors.ts"
import { SETTING_KEYS } from "#/domain/settings/setting-keys.ts"
import type { ORPCContext } from "#/presentation/orpc/context"
import {
	protectedProcedure,
	publicProcedure,
} from "#/presentation/orpc/middleware"

const DEFAULT_BULK_CAPTURE_LIMIT = 100
const ABSOLUTE_BULK_CAPTURE_LIMIT = 1000

function isLinkedInUrl(value: string): boolean {
	try {
		const hostname = new URL(value).hostname.toLowerCase()
		return hostname === "linkedin.com" || hostname.endsWith(".linkedin.com")
	} catch {
		return false
	}
}

const linkedinUrlSchema = z.preprocess(
	(value) => (value === "" ? undefined : value),
	z
		.string()
		.url("Valid LinkedIn URL is required")
		.refine(isLinkedInUrl, "URL must use linkedin.com")
		.optional(),
)

const captureLeadSchema = z.object({
	fullName: z.string().min(1, "Name is required"),
	email: z.string().email("Valid email is required"),
	companyName: z.string().min(1, "Company name is required"),
	companyWebsite: z.string().url("Valid website URL is required"),
	painPoints: z.string().optional(),
	leadSource: z.string().optional(),
	linkedinUrl: linkedinUrlSchema,
})

const bulkCaptureLeadSchema = z.object({
	leads: z
		.array(captureLeadSchema)
		.min(1, "At least one lead is required")
		.max(
			ABSOLUTE_BULK_CAPTURE_LIMIT,
			`Maximum ${ABSOLUTE_BULK_CAPTURE_LIMIT} leads per request`,
		),
})

export const leadRouter = os.$context<ORPCContext>().router({
	capture: publicProcedure
		.input(captureLeadSchema)
		.handler(async ({ input, context }) => {
			// Phase 1: Capture lead synchronously (fast — validate + save to DB)
			const lead = await context.useCases.lead.capture(input)

			// Phase 2: Fire-and-forget — run the rest of the pipeline in the background
			context.useCases.pipeline.runOutboundForExistingLead(lead).catch(() => {
				context.useCases.lead
					.updateStatus(lead.id, "research_failed")
					.catch(() => {})
			})

			return { leadId: lead.id, status: "pipeline_started" }
		}),

	captureBulk: protectedProcedure
		.input(bulkCaptureLeadSchema)
		.output(
			z.object({
				created: z.array(z.any()),
				duplicates: z.array(
					z.object({
						email: z.string(),
						fullName: z.string(),
						reason: z.string(),
					}),
				),
				invalid: z.array(
					z.object({
						email: z.string(),
						fullName: z.string(),
						reason: z.string(),
					}),
				),
			}),
		)
		.handler(async ({ input, context }) => {
			const maxLeads = await getBulkCaptureLimit(context)
			if (input.leads.length > maxLeads) {
				throw badRequest(`Maximum ${maxLeads} leads per batch`)
			}

			return context.useCases.lead.bulkCapture(input.leads)
		}),

	list: protectedProcedure
		.input(
			z.object({
				page: z.number().int().positive().default(1),
				limit: z.number().int().positive().default(20),
				stage: z.number().optional(),
				status: z.string().optional(),
			}),
		)
		.output(
			z.object({
				leads: z.array(z.any()),
				total: z.number(),
			}),
		)
		.handler(async ({ input, context }) => {
			return context.useCases.lead.list(input)
		}),

	getDetail: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.output(z.any())
		.handler(async ({ input, context }) => {
			return context.useCases.lead.getDetail(input.id)
		}),

	getPipelineSteps: protectedProcedure
		.input(z.object({ leadId: z.string().uuid() }))
		.output(z.array(z.any()))
		.handler(async ({ input, context }) => {
			return context.useCases.pipeline.getSteps(input.leadId)
		}),
	retry: protectedProcedure
		.input(z.object({ leadId: z.string().uuid() }))
		.output(z.object({ status: z.string() }))
		.handler(async ({ input, context }) => {
			return context.useCases.pipeline.retry(input.leadId)
		}),
})

async function getBulkCaptureLimit(context: ORPCContext): Promise<number> {
	const configuredLimit = await context.useCases.settings.get<number | string>(
		SETTING_KEYS.PIPELINE_BULK_IMPORT_MAX,
		DEFAULT_BULK_CAPTURE_LIMIT,
	)
	const limit = Number(configuredLimit)

	if (!Number.isFinite(limit) || limit < 1) {
		return DEFAULT_BULK_CAPTURE_LIMIT
	}

	return Math.min(Math.floor(limit), ABSOLUTE_BULK_CAPTURE_LIMIT)
}
