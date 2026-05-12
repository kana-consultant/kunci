import { eq } from "drizzle-orm"
import { auth } from "../auth/better-auth.ts"
import { env } from "../config/env.ts"
import { db, pgClient } from "./client.ts"
import { appSettings, user } from "./schema.ts"
import { DEFAULT_SETTINGS } from "./seed-settings.ts"

async function seed() {
	console.log("🌱 Seeding database...")

	const adminEmail = env.ADMIN_USER
	const adminPassword = env.ADMIN_PASS || "admin123"

	if (!adminEmail) {
		console.error("❌ ADMIN_USER is not defined in environment")
		process.exit(1)
	}

	try {
		console.log(`👤 Creating admin account: ${adminEmail}`)

		// Check if user already exists
		const existingUser = await db.query.user.findFirst({
			where: eq(user.email, adminEmail),
		})

		if (existingUser) {
			console.log(
				"ℹ️ Admin user already exists, updating role and verification...",
			)
			await db
				.update(user)
				.set({
					role: "admin",
					emailVerified: true,
				})
				.where(eq(user.email, adminEmail))
		} else {
			// Create user via better-auth to handle password hashing
			const result = await auth.api.signUpEmail({
				body: {
					email: adminEmail,
					password: adminPassword,
					name: "Admin",
				},
			})

			if (!result) {
				throw new Error("Failed to create user via better-auth")
			}

			// Update role and emailVerified
			await db
				.update(user)
				.set({
					role: "admin",
					emailVerified: true,
				})
				.where(eq(user.email, adminEmail))

			console.log("✅ Admin user created successfully!")
		}

		console.log("⚙️ Seeding default settings...")
		for (const setting of DEFAULT_SETTINGS) {
			// app_settings.value is NOT NULL — null defaults mean "no value yet"
			// and are served from the hardcoded fallback in SettingsService instead.
			if (setting.value === null) continue
			await db
				.insert(appSettings)
				.values({
					key: setting.key,
					value: setting.value,
					category: setting.category,
					label: setting.label,
					description: setting.description,
					valueType: setting.valueType,
				})
				.onConflictDoNothing()
		}
		console.log("✅ Default settings seeded successfully!")
	} catch (error) {
		console.error("❌ Seeding failed:", error)
		process.exit(1)
	} finally {
		await pgClient.end()
	}
}

seed()
