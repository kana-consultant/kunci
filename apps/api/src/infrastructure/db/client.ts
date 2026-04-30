import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { env } from "../config/env.ts"
import * as schema from "./schema.ts"

export const pgClient = postgres(env.DATABASE_URL, { max: 20, idle_timeout: 30 })
export const db = drizzle(pgClient, { schema })

export function createDb(_url: string) {
	return db
}

export type Database = typeof db
