CREATE TABLE "integrations" (
	"key" text PRIMARY KEY NOT NULL,
	"data" text DEFAULT '' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "source" text DEFAULT 'site' NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "linkedin_urn" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "linkedin_shared_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_linkedin_urn_unique" UNIQUE("linkedin_urn");