import type { AppRouter } from "@kunci/api"
import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import { createORPCReactQueryUtils } from "@orpc/react-query"
import { resolveRpcUrl } from "./resolve-rpc-url"

const link = new RPCLink({
	url: resolveRpcUrl(
		import.meta.env.DEV,
		typeof window !== "undefined" ? window.location.origin : undefined,
	),
})

// @ts-expect-error - oRPC v1.4.0 constraint mismatch
export const orpcClient = createORPCClient<AppRouter>(link as any) as any
export const orpc = createORPCReactQueryUtils(orpcClient) as any
