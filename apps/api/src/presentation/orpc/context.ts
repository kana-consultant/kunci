import type { AuthedContext } from "#/application/shared/context.ts"
import type { UseCases } from "#/application/use-cases.ts"
import type { Logger } from "#/domain/ports/logger.ts"

export type ORPCContext = {
	headers: Headers
	session: AuthedContext | null
	useCases: UseCases
	requestId: string
	logger: Logger
}
