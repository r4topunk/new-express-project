import { pgTable, text, uuid, timestamp, integer } from "drizzle-orm/pg-core";

export const redirects = pgTable("redirects", {
  uuid: uuid("uuid").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  description: text("description"),
  number: integer("number"),
  group: integer("group"),
  xLocation: integer("x_location"),
  zLocation: integer("z_location"),
  phyditalContract: text("phydital_contract"),
  phyditalTokenId: integer("phydital_token_id"),
  poapContract: text("poap_contract"),
  poapTokenId: integer("poap_token_id"),
  chainId: integer("chain_id"),
});
