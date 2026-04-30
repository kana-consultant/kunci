import { migrate } from "drizzle-orm/postgres-js/migrator"
import { db, pgClient } from "./infrastructure/db/client.ts"

async function runMigration() {
	console.log("⏳ Running migrations...")

	try {
		await migrate(db, { migrationsFolder: "drizzle" })
		console.log("✅ Migrations completed!")
	} catch (error) {
		console.error("❌ Migration failed:", error)
		process.exit(1)
	} finally {
		await pgClient.end()
	}
}

runMigration()
