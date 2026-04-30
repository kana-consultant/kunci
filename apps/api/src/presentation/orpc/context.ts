import type { AuthedContext } from "#/application/shared/context.ts"
import type { UseCases } from "#/application/use-cases.ts"

export interface ORPCContext {
  headers: Headers
  session: AuthedContext | null
  useCases: UseCases
}
