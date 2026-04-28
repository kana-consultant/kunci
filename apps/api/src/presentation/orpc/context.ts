import type { UseCases } from "#/application/use-cases.ts"
import type { AuthedContext } from "#/application/shared/context.ts"

export interface ORPCContext {
	headers: Headers
	session: AuthedContext | null
	useCases: UseCases
}
