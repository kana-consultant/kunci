import { createAuthClient } from "better-auth/react"

const API_BASE = import.meta.env.VITE_API_URL || window.location.origin

export const authClient = createAuthClient({
	baseURL: `${API_BASE}/api/auth`,
})
