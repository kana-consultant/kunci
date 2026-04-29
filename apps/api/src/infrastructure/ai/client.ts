import { logger } from "#/infrastructure/observability/logger.ts"

export interface CallParams {
	model: string
	messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
	schema?: { name: string; schema: Record<string, unknown> }
	temperature?: number
}

interface OpenRouterResponse {
	choices: Array<{ message: { content: string } }>
	usage?: {
		prompt_tokens: number
		completion_tokens: number
		total_tokens: number
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function callOpenRouter<T>(
	apiKey: string,
	params: CallParams,
): Promise<T> {
	const { model, messages, schema, temperature = 0.7 } = params
	const maxRetries = 3

	const body: Record<string, unknown> = { model, messages, temperature }

	if (schema) {
		body.response_format = {
			type: "json_schema",
			json_schema: {
				name: schema.name,
				strict: true,
				schema: { ...schema.schema, additionalProperties: false },
			},
		}
		body.plugins = [{ id: "response-healing" }]
	}

	let lastError: Error | null = null

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			const response = await fetch(
				"https://openrouter.ai/api/v1/chat/completions",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${apiKey}`,
						"Content-Type": "application/json",
						"X-OpenRouter-Title": "KUNCI AI SDR",
					},
					body: JSON.stringify(body),
				},
			)

			if (response.status === 429) {
				const retryAfter = response.headers.get("retry-after")
				const wait = retryAfter
					? Number(retryAfter) * 1000
					: 2 ** attempt * 1000
				logger.warn({ attempt, wait }, "OpenRouter rate limited, retrying")
				await sleep(wait)
				continue
			}

			if (!response.ok) {
				const errorText = await response.text()
				throw new Error(`OpenRouter ${response.status}: ${errorText}`)
			}

			const data = (await response.json()) as OpenRouterResponse
			const content = data.choices[0]?.message?.content

			if (!content) throw new Error("Empty response from OpenRouter")

			if (data.usage) {
				logger.debug(
					{ model, tokens: data.usage.total_tokens },
					"OpenRouter usage",
				)
			}

			if (schema) {
				return JSON.parse(content) as T
			}
			return content as T
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error))
			logger.warn(
				{ attempt, error: lastError.message },
				"OpenRouter call failed",
			)
			if (attempt < maxRetries - 1) {
				await sleep(2 ** attempt * 1000)
			}
		}
	}

	throw lastError ?? new Error("OpenRouter call failed after retries")
}
