import type { AppRouter } from "@kunci/api"
import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import { createORPCReactQueryUtils } from "@orpc/react-query"
import type { RouterClient } from "@orpc/server"

const API_BASE = import.meta.env.VITE_API_URL || window.location.origin

const link = new RPCLink({
	url: `${API_BASE}/rpc`,
})

export const orpcClient = createORPCClient(link) as RouterClient<AppRouter>
export const orpc = createORPCReactQueryUtils(orpcClient)
