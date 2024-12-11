CREATE TABLE IF NOT EXISTS "redirects" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"number" integer,
	"group" integer,
	"x_location" integer,
	"z_location" integer,
	"phydital_contract" text,
	"phydital_token_id" integer,
	"poap_contract" text,
	"poap_token_id" integer,
	"chain_id" integer
);
