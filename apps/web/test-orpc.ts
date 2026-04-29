import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"

const link = new RPCLink({ url: "http://localhost:8021/rpc" })
const client = createORPCClient(link) as any

async function test() {
	try {
		const res = await client.lead.list({ page: 1, limit: 50 })
		console.log("Success:", res)
	} catch (e) {
		console.error("Error:", e)
	}
}
test()
