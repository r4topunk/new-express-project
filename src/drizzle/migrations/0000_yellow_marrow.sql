-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE IF NOT EXISTS "nft_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_address" text NOT NULL,
	"token_address" text NOT NULL,
	"token_id" integer NOT NULL,
	"chain_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "redirects" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"phydital_contract" text,
	"phydital_token_id" integer,
	"poap_contract" text,
	"poap_token_id" integer,
	"chain_id" integer,
	"number" integer,
	"group" integer,
	"x_location" integer,
	"z_location" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"description" text NOT NULL,
	"link" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"secret" boolean DEFAULT false
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

*/