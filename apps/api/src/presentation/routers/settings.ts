import { os } from "@orpc/server"
import { z } from "zod"
import type { ORPCContext } from "#/presentation/orpc/context.ts"
import { protectedProcedure } from "#/presentation/orpc/middleware.ts"

export const settingsRouter = os.$context<ORPCContext>().router({
	getAll: protectedProcedure
		.output(
			z.array(
				z.object({
					key: z.string(),
					value: z.any(),
					category: z.string(),
					label: z.string(),
					description: z.string().nullable(),
					valueType: z.string(),
					updatedAt: z.date(),
					updatedBy: z.string().nullable(),
				}),
			),
		)
		.handler(async ({ context }) => {
			return context.useCases.settings.getAll()
		}),

	getByCategory: protectedProcedure
		.input(z.object({ category: z.string() }))
		.output(
			z.array(
				z.object({
					key: z.string(),
					value: z.any(),
					category: z.string(),
					label: z.string(),
					description: z.string().nullable(),
					valueType: z.string(),
					updatedAt: z.date(),
					updatedBy: z.string().nullable(),
				}),
			),
		)
		.handler(async ({ input, context }) => {
			return context.useCases.settings.getByCategory(input.category)
		}),

	update: protectedProcedure
		.input(
			z.object({
				key: z.string(),
				value: z.any(),
			}),
		)
		.output(
			z.object({
				key: z.string(),
				value: z.any(),
				category: z.string(),
				label: z.string(),
				description: z.string().nullable(),
				valueType: z.string(),
				updatedAt: z.date(),
				updatedBy: z.string().nullable(),
			}),
		)
		.handler(async ({ input, context }) => {
			return context.useCases.settings.set(input.key, input.value, context.session?.userId)
		}),

	updateBulk: protectedProcedure
		.input(
			z.object({
				entries: z.array(
					z.object({
						key: z.string(),
						value: z.any(),
					}),
				),
			}),
		)
		.output(z.object({ success: z.boolean() }))
		.handler(async ({ input, context }) => {
			await context.useCases.settings.setBulk(input.entries as Array<{ key: string; value: any }>, context.session?.userId)
			return { success: true }
		}),

	reset: protectedProcedure
		.input(z.object({ key: z.string() }))
		.output(z.object({ success: z.boolean() }))
		.handler(async ({ input, context }) => {
			await context.useCases.settings.resetToDefault(input.key)
			return { success: true }
		}),
})
