CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"resource_id" text,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "behavior_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"pain_points" text NOT NULL,
	"behavioral_profile" text NOT NULL,
	"journey_stage" text NOT NULL,
	"psychological_triggers" text NOT NULL,
	"optimal_approach" text NOT NULL,
	"conversion_probability" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"email_number" integer NOT NULL,
	"subject_lines" text[] DEFAULT '{}' NOT NULL,
	"content" text NOT NULL,
	"html_content" text,
	"cta" text NOT NULL,
	"psychological_trigger" text NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"company_name" text NOT NULL,
	"company_website" text NOT NULL,
	"pain_points" text,
	"lead_source" text,
	"company_research" text,
	"stage" integer DEFAULT 0 NOT NULL,
	"reply_status" text DEFAULT 'pending' NOT NULL,
	"latest_message_id" text,
	"message_ids" text[] DEFAULT '{}' NOT NULL,
	"last_email_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leads_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "behavior_analyses" ADD CONSTRAINT "behavior_analyses_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_sequences" ADD CONSTRAINT "email_sequences_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;