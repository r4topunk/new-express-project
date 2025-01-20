import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
// import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from "postgres";
import { DATABASE_DIRECT_URL } from "../utils/constants";

// const migrationClient = postgres(process.env.DATABASE_DIRECT_URL || '', {
//   max: 1,
// });

// await migrate(drizzle(migrationClient), {
//   migrationsFolder: 'src/drizzle/migrations',
// });

const queryClient = postgres(DATABASE_DIRECT_URL);

export const db: PostgresJsDatabase = drizzle(queryClient, {
  logger: true,
});
