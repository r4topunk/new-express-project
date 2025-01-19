CREATE TABLE IF NOT EXISTS "links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"description" text NOT NULL,
	"link" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nfc" text,
	"username" text NOT NULL,
	"address" text NOT NULL,
	"email" text NOT NULL,
	"avatar" text NOT NULL,
	"bio" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"x" text,
	"instagram" text,
	"tiktok" text,
	"shop" text,
	"contact_email" text,
	CONSTRAINT "users_nfc_unique" UNIQUE("nfc")
);
