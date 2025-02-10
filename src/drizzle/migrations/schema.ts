import { pgTable, uuid, text, integer, timestamp, boolean, unique } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"




export const nftClaims = pgTable("nft_claims", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	userAddress: text("user_address").notNull(),
	tokenAddress: text("token_address").notNull(),
	tokenId: integer("token_id").notNull(),
	chainId: integer("chain_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const redirects = pgTable("redirects", {
	uuid: uuid("uuid").defaultRandom().primaryKey().notNull(),
	url: text("url").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	description: text("description"),
	phyditalContract: text("phydital_contract"),
	phyditalTokenId: integer("phydital_token_id"),
	poapContract: text("poap_contract"),
	poapTokenId: integer("poap_token_id"),
	chainId: integer("chain_id"),
	number: integer("number"),
	group: integer("group"),
	xLocation: integer("x_location"),
	zLocation: integer("z_location"),
});

export const links = pgTable("links", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	description: text("description").notNull(),
	link: text("link").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	secret: boolean("secret").default(false),
});

export const users = pgTable("users", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	nfc: text("nfc"),
	username: text("username").notNull(),
	address: text("address").notNull(),
	email: text("email").notNull(),
	avatar: text("avatar").notNull(),
	bio: text("bio").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	x: text("x"),
	instagram: text("instagram"),
	tiktok: text("tiktok"),
	shop: text("shop"),
	contactEmail: text("contact_email"),
},
(table) => {
	return {
		usersNfcUnique: unique("users_nfc_unique").on(table.nfc),
	}
});