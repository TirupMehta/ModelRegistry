CREATE TABLE "waitlist_rate_limits" (
	"key_hash" text PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist_signups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"consent_given" boolean NOT NULL,
	"consent_at" timestamp with time zone NOT NULL,
	"consent_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_signups_email_normalized" CHECK ("waitlist_signups"."email" = lower("waitlist_signups"."email")),
	CONSTRAINT "waitlist_signups_email_shape" CHECK ("waitlist_signups"."email" ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
	CONSTRAINT "waitlist_signups_email_length" CHECK (char_length("waitlist_signups"."email") <= 254),
	CONSTRAINT "waitlist_signups_consent_recorded" CHECK ("waitlist_signups"."consent_given" and "waitlist_signups"."consent_version" <> '')
);
--> statement-breakpoint
CREATE UNIQUE INDEX "waitlist_signups_email_key" ON "waitlist_signups" USING btree ("email");