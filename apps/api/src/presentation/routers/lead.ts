import { os } from "@orpc/server"
import { z } from "zod"
import { publicProcedure, protectedProcedure } from "../orpc/middleware.ts"

const captureLeadSchema = z.object({
	fullName: z.string().min(1, "Name is required"),
	email: z.string().email("Valid email is required"),
	companyName: z.string().min(1, "Company name is required"),
	companyWebsite: z.string().url("Valid website URL is required"),
	painPoints: z.string().optional(),
	leadSource: z.string().optional(),
})

// @ts-ignore - oRPC v1.4.0 constraint mismatch
export const leadRouter = os.router({
		// @ts-ignore - oRPC constraint mismatch
		capture: publicProcedure
			.input(captureLeadSchema)
			.handler(async ({ input, context }) => {
				// We return the result immediately to the client
				// The pipeline will continue running in the background if we decouple it,
				// but for simplicity in V1 we await it, or just return the capture result and trigger async.
				// Here we just trigger the full pipeline
				return context.useCases.pipeline.runOutbound(input)
			}),

		// @ts-ignore - oRPC constraint mismatch
		list: protectedProcedure
			.input(
				z.object({
					page: z.number().int().positive().default(1),
					limit: z.number().int().positive().default(20),
					stage: z.number().optional(),
					status: z.string().optional(),
				}),
			)
			.handler(async ({ input, context }) => {
				return context.useCases.lead.list(input)
			}),

		// @ts-ignore - oRPC constraint mismatch
		getDetail: protectedProcedure
			.input(z.object({ id: z.string().uuid() }))
			.handler(async ({ input, context }) => {
				return context.useCases.lead.getDetail(input.id)
			}),
})
