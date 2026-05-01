import { os } from "@orpc/server"
import { z } from "zod"
import { AppError } from "#/application/shared/errors.ts"
import { callOpenRouter } from "#/infrastructure/ai/client.ts"
import { env } from "#/infrastructure/config/env.ts"
import type { ORPCContext } from "#/presentation/orpc/context.ts"
import { protectedProcedure } from "#/presentation/orpc/middleware.ts"

export const sandboxRouter = os.$context<ORPCContext>().router({
	runAiPrompt: protectedProcedure
		.input(
			z.object({
				systemPrompt: z.string().min(1),
				userInput: z.string().optional(),
				urlToScrape: z.string().url().optional(),
				model: z.string().min(1),
				temperature: z.number().min(0).max(2).default(0.7),
			}),
		)
		.output(
			z.object({
				output: z.string(),
				durationMs: z.number(),
				model: z.string(),
				inputTokensEst: z.number(),
			}),
		)
		.handler(async ({ input, context }) => {
			const start = Date.now()
			try {
				let finalUserInput = input.userInput || ""

				if (input.urlToScrape) {
					const scraped = await context.useCases.scraper.readUrl(
						input.urlToScrape,
					)
					if (!scraped.success || !scraped.markdown) {
						throw new Error(`Failed to scrape website: ${input.urlToScrape}`)
					}
					finalUserInput = scraped.markdown
				}

				if (!finalUserInput) {
					throw new Error("No user input provided or scraped content was empty")
				}

				const output = await callOpenRouter<string>(
					env.OPENROUTER_API_KEY,
					{
						model: input.model,
						messages: [
							{ role: "system", content: input.systemPrompt },
							{ role: "user", content: finalUserInput },
						],
						temperature: input.temperature,
					},
					1,
				)
				return {
					output,
					durationMs: Date.now() - start,
					model: input.model,
					inputTokensEst: Math.ceil(
						(input.systemPrompt.length + finalUserInput.length) / 4,
					),
				}
			} catch (err) {
				throw new AppError(
					"BAD_REQUEST",
					`AI call failed: ${err instanceof Error ? err.message : String(err)}`,
				)
			}
		}),

	previewEmailHtml: protectedProcedure
		.input(
			z.object({
				emailText: z.string().min(1),
				colors: z
					.object({
						primary: z.string().default("#2563eb"),
						accent: z.string().default("#f97316"),
						cta: z.string().default("#16a34a"),
						text: z.string().default("#374151"),
						background: z.string().default("#ffffff"),
						fontFamily: z.string().default("Arial, Helvetica, sans-serif"),
					})
					.optional(),
			}),
		)
		.output(z.object({ html: z.string() }))
		.handler(async ({ input, context }) => {
			const stored = await context.useCases.settings.get<string>(
				"ai.prompt.html_converter",
				"",
			)
			const basePrompt =
				stored ||
				`Convert the given email content into clean, professional HTML email code.
CRITICAL RULES:
- Output ONLY the HTML code—no explanations, no markdown code blocks, no commentary
- Use table-based layouts for email client compatibility
- Apply ALL CSS inline using style attributes
- Ensure mobile responsiveness`

			const { colors } = input
			const colorSection = colors
				? `\n\nColor Scheme (apply these EXACTLY):\n- Primary: ${colors.primary}\n- Accent: ${colors.accent}\n- CTA Buttons: ${colors.cta} with border-radius: 6px, padding: 12px 24px\n- Text: ${colors.text}\n- Background: ${colors.background}\n- Font: ${colors.fontFamily}`
				: ""

			const html = await callOpenRouter<string>(
				env.OPENROUTER_API_KEY,
				{
					model: "openai/gpt-4o-mini",
					messages: [
						{ role: "system", content: basePrompt + colorSection },
						{ role: "user", content: input.emailText },
					],
					temperature: 0.2,
				},
				1,
			)

			return { html }
		}),

	generateBusinessSample: protectedProcedure
		.input(
			z.object({
				leadDraft: z.object({
					fullName: z.string().default("Alex Johnson"),
					companyName: z.string().default("Acme Corp"),
					companyWebsite: z.string().default("https://acme.com"),
					painPoints: z
						.string()
						.default("Struggling with manual lead outreach"),
				}),
				businessOverride: z
					.object({
						name: z.string().optional(),
						description: z.string().optional(),
						valueProposition: z.string().optional(),
						targetMarket: z.string().optional(),
						toneOfVoice: z.string().optional(),
						offerings: z
							.array(
								z.object({
									name: z.string(),
									type: z.enum(["product", "service"]),
									description: z.string(),
									keyBenefits: z.array(z.string()),
								}),
							)
							.optional(),
					})
					.optional(),
			}),
		)
		.output(
			z.object({
				emailSubject: z.string(),
				emailBody: z.string(),
				durationMs: z.number(),
			}),
		)
		.handler(async ({ input, context }) => {
			const settings = context.useCases.settings
			const override = input.businessOverride ?? {}

			const bizName =
				override.name ?? (await settings.get<string>("business.name", ""))
			const bizDesc =
				override.description ??
				(await settings.get<string>("business.description", ""))
			const bizVP =
				override.valueProposition ??
				(await settings.get<string>("business.value_proposition", ""))
			const bizTone =
				override.toneOfVoice ??
				(await settings.get<string>("business.tone_of_voice", "professional"))
			const bizOfferings =
				override.offerings ??
				(await settings.get<
					Array<{
						name: string
						type: string
						description: string
						keyBenefits: string[]
					}>
				>("business.offerings", []))

			const offeringsText =
				bizOfferings.length > 0
					? bizOfferings
							.map(
								(o) =>
									`- ${o.name} (${o.type}): ${o.description}. Benefits: ${(o.keyBenefits ?? []).join(", ")}`,
							)
							.join("\n")
					: "No specific offerings configured."

			const prompt = await settings.get<string>(
				"ai.prompt.sequence_generator",
				"You are an expert outbound sales copywriter. Write personalized, concise cold emails.",
			)

			const userInput = `
SENDER BUSINESS CONTEXT:
Company: ${bizName || "(not set)"}
Description: ${bizDesc || "(not set)"}
Value Proposition: ${bizVP || "(not set)"}
Tone of Voice: ${bizTone}
Offerings:
${offeringsText}

LEAD TO OUTREACH:
Name: ${input.leadDraft.fullName}
Company: ${input.leadDraft.companyName}
Website: ${input.leadDraft.companyWebsite}
Pain Points: ${input.leadDraft.painPoints}

Generate ONLY Email 1 (the introduction email). Output format:
Subject: <subject line>
Body: <email body text, no HTML>
`.trim()

			const model = await settings.get<string>(
				"ai.model.email_generator",
				"openai/gpt-4o-mini",
			)
			const start = Date.now()

			const raw = await callOpenRouter<string>(
				env.OPENROUTER_API_KEY,
				{
					model,
					messages: [
						{ role: "system", content: prompt },
						{ role: "user", content: userInput },
					],
					temperature: 0.7,
				},
				1,
			)

			const subjectMatch = raw.match(/Subject:\s*(.+)/i)
			const bodyMatch = raw.match(/Body:\s*([\s\S]+)/i)

			return {
				emailSubject: subjectMatch?.[1]?.trim() ?? "(No subject generated)",
				emailBody: bodyMatch?.[1]?.trim() ?? raw,
				durationMs: Date.now() - start,
			}
		}),
})

export type SandboxRouter = typeof sandboxRouter
