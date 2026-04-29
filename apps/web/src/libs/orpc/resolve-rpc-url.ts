export function resolveRpcUrl(
	isDev: boolean,
	windowOrigin?: string,
): string {
	if (isDev) {
		return "http://localhost:3005/rpc"
	}

	if (windowOrigin) {
		return `${windowOrigin}/rpc`
	}

	return "/rpc"
}
