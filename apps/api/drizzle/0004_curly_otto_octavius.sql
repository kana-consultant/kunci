CREATE TABLE "opt_outs" (
	"email" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"reason" text,
	"source" text DEFAULT 'unsubscribe_link' NOT NULL,
	"opted_out_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "opt_outs_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "locale" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "language" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "timezone" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "company_industry" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "company_size" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "enriched_at" timestamp with time zone;