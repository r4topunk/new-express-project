import { relations } from "drizzle-orm";
import { pgTable, text, uuid, timestamp, integer } from "drizzle-orm/pg-core";
import { links } from "./links";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  nfc: text("nfc").unique(),
  username: text("username").notNull(),
  address: text("address").notNull(),
  email: text("email").notNull(),
  avatar: text("avatar").notNull(),
  bio: text("bio").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  x: text("x"),
  instagram: text("instagram"),
  tiktok: text("tiktok"),
  shop: text("shop"),
  contact_email: text("contact_email"),
});

export const usersRelations = relations(users, ({ many }) => ({
  links: many(links),
}));
