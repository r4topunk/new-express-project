import { pgTable, text, uuid, timestamp, integer } from "drizzle-orm/pg-core";
import { projects } from "./projects";

export const redirects = pgTable("redirects", {
  uuid: uuid("uuid").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  description: text("description"),
  phyditalContract: text("phydital_contract"),
  phyditalTokenId: integer("phydital_token_id"),
  poapContract: text("poap_contract"),
  poapTokenId: integer("poap_token_id"),
  chainId: integer("chain_id"),
  projectId: integer("project_id").references(() => projects.id),
});
