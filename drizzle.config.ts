import "dotenv/config";

import { defineConfig } from "drizzle-kit";
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/drizzle/schema/*",
  out: "./src/drizzle/migrations",
  dbCredentials: {
    url: process.env.DATABASE_DIRECT_URL || "",
  },
});
