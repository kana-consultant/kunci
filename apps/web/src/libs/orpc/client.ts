// @ts-nocheck
import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import { createORPCReactQueryUtils } from "@orpc/react-query"
import type { AppRouter } from "@kunci/api"

const link = new RPCLink({
	url: "/rpc",
})

export const orpcClient = createORPCClient<AppRouter>(link)
export const orpc = createORPCReactQueryUtils(orpcClient)
