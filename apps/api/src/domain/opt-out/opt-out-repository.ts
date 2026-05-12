import type { OptOut, OptOutSource } from "./opt-out.ts"

export interface CreateOptOutInput {
	email: string
	token: string
	reason?: string | null
	source?: OptOutSource
}

export interface OptOutRepository {
	create(input: CreateOptOutInput): Promise<OptOut>
	findByEmail(email: string): Promise<OptOut | null>
	findByToken(token: string): Promise<OptOut | null>
	has(email: string): Promise<boolean>
}
