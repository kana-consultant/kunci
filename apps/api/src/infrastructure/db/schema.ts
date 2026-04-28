import {
	pgTable,
	text,
	integer,
	timestamp,
	real,
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
	messageIds: text("message_ids")
		.array()
		.notNull()
		.default([]),
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
	subjectLines: text("subject_lines")
		.array()
		.notNull()
		.default([]),
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
