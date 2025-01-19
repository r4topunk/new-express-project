import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"




export const redirects = pgTable("redirects", {
	uuid: uuid("uuid").defaultRandom().primaryKey().notNull(),
	url: text("url").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
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