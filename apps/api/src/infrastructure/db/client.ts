import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema.ts"

export function createDb(url: string) {
  const client = postgres(url, { max: 20, idle_timeout: 30 })
  return drizzle(client, { schema })
}

export type Database = ReturnType<typeof createDb>
