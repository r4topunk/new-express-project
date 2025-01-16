import { db } from "../drizzle";
import { redirects } from "./schema/redirects";

async function seed() {
  for (let i = 0; i < 10; i++) {
    console.log("inserting", i);
    await db
      .insert(redirects)
      .values({ url: "https://www.t0fu.com.br/?to=NTS" });
  }

  console.log("Seeding...");
  console.time("DB has been seeded!");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    console.log("Seeding done!");
    process.exit(0);
  });
