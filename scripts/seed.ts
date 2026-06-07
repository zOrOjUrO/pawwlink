// Seed script — run with: npm run seed   (or: npx tsx scripts/seed.ts)
import { config } from "dotenv";
config({ path: process.env.ENV_FILE ?? ".env.local" });

import { wipeDemo, seedDemo } from "../lib/db/demoSeed";

async function main() {
  console.log("Wiping existing demo data…");
  await wipeDemo();
  console.log("Seeding rich demo data…");
  const seeded = await seedDemo();
  console.log(`\nDone. Seeded ${seeded} animal rows (3 owners + 4 found animals).`);
  console.log("Demo chip (Amivedi): 528140000123456");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
