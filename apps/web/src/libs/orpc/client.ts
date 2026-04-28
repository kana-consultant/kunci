import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import { createORPCReactQueryUtils } from "@orpc/react-query"
import type { AppRouter } from "@kunci/api"

const link = new RPCLink({
	url: "/rpc",
})

/**
 * oRPC v1.4 server `Procedure` types don't directly satisfy
 * the client `NestedClient` constraint. This cast is the
 * recommended workaround until oRPC v2 unifies the types.
 * All downstream usage (orpc.lead.capture, etc.) remains fully typed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const orpcClient = createORPCClient<AppRouter>(link as any)
export const orpc = createORPCReactQueryUtils(orpcClient)
