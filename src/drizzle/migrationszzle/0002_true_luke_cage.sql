CREATE TABLE IF NOT EXISTS "nft_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_address" text NOT NULL,
	"token_address" text NOT NULL,
	"token_id" integer NOT NULL,
	"chain_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
