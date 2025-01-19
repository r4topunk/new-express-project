import { pgTable, text, uuid, timestamp, integer } from "drizzle-orm/pg-core";

export const nftClaims = pgTable("nft_claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_address: text("user_address").notNull(),
  token_address: text("token_address").notNull(),
  token_id: integer("token_id").notNull(),
  chain_id: integer("chain_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});
