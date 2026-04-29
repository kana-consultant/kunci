import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import { createORPCReactQueryUtils } from "@orpc/react-query"
import type { AppRouter } from "@kunci/api"

const link = new RPCLink({
	url: import.meta.env.DEV 
		? "http://localhost:3005/rpc" 
		: typeof window !== "undefined" ? `${window.location.origin}/rpc` : "/rpc",
})

// @ts-expect-error - oRPC v1.4.0 constraint mismatch
export const orpcClient = createORPCClient<AppRouter>(link as any) as any
export const orpc = createORPCReactQueryUtils(orpcClient) as any
