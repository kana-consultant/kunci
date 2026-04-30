import type { AppRouter } from "@kunci/api"
import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import { createORPCReactQueryUtils } from "@orpc/react-query"
import type { RouterClient } from "@orpc/server"

const link = new RPCLink({
	url: import.meta.env.DEV
		? "http://localhost:3005/rpc"
		: typeof window !== "undefined"
			? `${window.location.origin}/rpc`
			: "/rpc",
})

export const orpcClient = createORPCClient(link) as RouterClient<AppRouter>
export const orpc = createORPCReactQueryUtils(orpcClient)
