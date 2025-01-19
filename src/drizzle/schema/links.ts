import { relations } from "drizzle-orm";
import { pgTable, text, uuid, timestamp, integer } from "drizzle-orm/pg-core";
import { users } from "./users";

export const links = pgTable("links", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  description: text("description").notNull(),
  link: text("link").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const linksRelations = relations(links, ({ one }) => ({
  author: one(users, {
    fields: [links.user_id],
    references: [users.id],
  }),
}));
