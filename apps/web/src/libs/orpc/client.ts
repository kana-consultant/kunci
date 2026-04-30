import type { AppRouter } from "@kunci/api"
import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import { createORPCReactQueryUtils } from "@orpc/react-query"

const link = new RPCLink({
  url: import.meta.env.DEV
    ? "http://localhost:3005/rpc"
    : typeof window !== "undefined"
      ? `${window.location.origin}/rpc`
      : "/rpc",
})

import type { RouterClient } from "@orpc/server"

export const orpcClient: RouterClient<AppRouter> = createORPCClient(link as any)
export const orpc = createORPCReactQueryUtils(orpcClient)
