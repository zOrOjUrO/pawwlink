// Seed script — run with: npm run seed   (or: npx tsx scripts/seed.ts)
//
// 1. seedDemoData(): inserts 3 fake owners, each with a registered pet.
// 2. Inserts 1 "found animal" whose embedding is CLOSE to owner #2's pet (Loki),
//    so /api/match always returns a high-confidence visual match in the demo.
// 3. Logs every inserted ID.
//
// Requires Supabase env (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY),
// loaded here from .env.local.
import { config } from "dotenv";
config({ path: process.env.ENV_FILE ?? ".env.local" });

import {
  seedDemoData,
  insertAnimal,
  mockEmbedding,
  DEMO_OWNERS,
  EMBEDDING_DIM,
} from "../lib/db/supabase";
import type { Passport } from "../lib/types";

/** Slightly perturb a unit embedding and re-normalize (cosine stays ~0.99). */
function perturb(vec: number[], eps = 0.005): number[] {
  const v = vec.map((x) => x + (Math.random() * 2 - 1) * eps);
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => Number((x / norm).toFixed(6)));
}

async function main() {
  console.log("Seeding demo data...\n");

  const { owners, pets } = await seedDemoData();
  console.log("Owners inserted:");
  owners.forEach((o) => console.log(`  ${o.id}  ${o.name}`));
  console.log("\nRegistered pets inserted:");
  pets.forEach((p) => console.log(`  ${p.id}  ${p.name} (owner ${p.ownerId})`));

  // Found animal close to owner #2's pet (Pieter Jansen / Loki, Golden Retriever).
  const owner2 = DEMO_OWNERS[1];
  const pet2 = owner2.pets[0];
  const baseEmbedding = mockEmbedding(`${owner2.name}:${pet2.name}`);
  const foundEmbedding = perturb(baseEmbedding);

  const passport: Passport = {
    species: "dog",
    breed: "Golden Retriever",
    breed_confidence: 0.9,
    coat: {
      primary_color: "golden",
      secondary_color: "cream",
      pattern: "solid",
      distinctive_markings: "feathered tail",
    },
    triage: {
      severity: "moderate",
      severity_score: 2,
      observed_injuries: ["mild limp, front left leg"],
      urgent: false,
      triage_notes: "Alert and responsive. Recommend examination within a few hours.",
    },
    biometric: {
      embedding: foundEmbedding,
      embedding_model: "clip-ViT-B-32",
      embedding_dim: EMBEDDING_DIM,
    },
    photo_meta: { image_url: null, capture_timestamp: new Date().toISOString() },
    raw_llm_response: "[seed] found animal (close to Loki)",
  };

  const foundId = await insertAnimal({ passport, embedding: foundEmbedding, status: "searching" });
  console.log(`\nFound animal inserted: ${foundId}`);
  console.log(`  -> matches registered pet "${pet2.name}" (owner ${owner2.name})`);
  console.log("\nDone. Open /api/health, then GET /api/match/" + foundId);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
