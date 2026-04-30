import {
	boolean,
	integer,
	jsonb,
	pgTable,
	real,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"

export const leads = pgTable("leads", {
	id: uuid("id").primaryKey().defaultRandom(),
	fullName: text("full_name").notNull(),
	email: text("email").notNull().unique(),
	companyName: text("company_name").notNull(),
	companyWebsite: text("company_website").notNull(),
	painPoints: text("pain_points"),
	leadSource: text("lead_source"),
	companyResearch: text("company_research"),
	stage: integer("stage").notNull().default(0),
	replyStatus: text("reply_status").notNull().default("pending"),
	latestMessageId: text("latest_message_id"),
	linkedinUrl: text("linkedin_url"),
	messageIds: text("message_ids").array().notNull().default([]),
	lastEmailSentAt: timestamp("last_email_sent_at", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
})

export const emailSequences = pgTable("email_sequences", {
	id: uuid("id").primaryKey().defaultRandom(),
	leadId: uuid("lead_id")
		.notNull()
		.references(() => leads.id, { onDelete: "cascade" }),
	emailNumber: integer("email_number").notNull(),
	subjectLines: text("subject_lines").array().notNull().default([]),
	content: text("content").notNull(),
	htmlContent: text("html_content"),
	cta: text("cta").notNull(),
	psychologicalTrigger: text("psychological_trigger").notNull(),
	sentAt: timestamp("sent_at", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
})

export const behaviorAnalyses = pgTable("behavior_analyses", {
	id: uuid("id").primaryKey().defaultRandom(),
	leadId: uuid("lead_id")
		.notNull()
		.references(() => leads.id, { onDelete: "cascade" }),
	painPoints: text("pain_points").notNull(),
	behavioralProfile: text("behavioral_profile").notNull(),
	journeyStage: text("journey_stage").notNull(),
	psychologicalTriggers: text("psychological_triggers").notNull(),
	optimalApproach: text("optimal_approach").notNull(),
	conversionProbability: real("conversion_probability").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
})

export const activityLog = pgTable("activity_log", {
	id: uuid("id").primaryKey().defaultRandom(),
	action: text("action").notNull(),
	resource: text("resource").notNull(),
	resourceId: text("resource_id"),
	metadata: text("metadata"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
})

/**
 * Pipeline Steps — granular, step-by-step tracking of pipeline execution.
 * Each row is one discrete action (e.g. "Scraping website", "Calling OpenRouter AI").
 */
export const pipelineSteps = pgTable("pipeline_steps", {
	id: uuid("id").primaryKey().defaultRandom(),
	leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }),
	/** Pipeline step identifier: capture, scrape, analyze_website, build_profile, analyze_behavior, generate_sequence, send_email */
	step: text("step").notNull(),
	/** Human-readable label, e.g. "Scraping https://cosulagi.id" */
	label: text("label").notNull(),
	/** running | completed | failed */
	status: text("status").notNull().default("running"),
	/** Duration in milliseconds (filled on completion) */
	durationMs: integer("duration_ms"),
	/** Extra context: error message, API URL, model name, etc. */
	detail: jsonb("detail").$type<Record<string, unknown>>(),
	startedAt: timestamp("started_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	completedAt: timestamp("completed_at", { withTimezone: true }),
})

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	role: text("role"),
})

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
})

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at"),
	updatedAt: timestamp("updated_at"),
})

export const appSettings = pgTable("app_settings", {
	key: text("key").primaryKey(),
	value: jsonb("value").notNull(),
	category: text("category").notNull(),
	label: text("label").notNull(),
	description: text("description"),
	valueType: text("value_type").notNull().default("string"),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
})
