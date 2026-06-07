// Rich, photogenic demo data + wipe/seed helpers for the recorded demo.
// Used by scripts/seed.ts (CLI) and POST /api/demo/reset.
import { getSupabase, insertOwner, insertAnimal, mockEmbedding } from "./supabase";
import { seededEmbedding } from "../embedding";
import type { Passport } from "../types";

const DIM = Number(process.env.EMBEDDING_DIM ?? 512);

function perturb(vec: number[], eps = 0.005): number[] {
  const v = vec.map((x) => x + (Math.random() * 2 - 1) * eps);
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => Number((x / norm).toFixed(6)));
}

const OWNERS = [
  { name: "Sophie van der Berg", phone: "+31612345678", email: "sophie@example.nl", pet: { name: "Nootje", breed: "Golden Retriever", species: "dog", sex: "female", coat: "golden", pattern: "solid" }, chip: "528140000123456" },
  { name: "Jan Pietersen", phone: "+31687654321", email: "jan@example.nl", pet: { name: "Grijs", breed: "European Shorthair", species: "cat", sex: "male", coat: "grey", pattern: "tabby" }, chip: null },
  { name: "Fatima El Amrani", phone: "+31698765432", email: "fatima@example.nl", pet: { name: "Max", breed: "Labrador Retriever", species: "dog", sex: "male", coat: "black", pattern: "solid" }, chip: "528140000654321" },
];

function passport(opts: {
  species: string; breed: string; primary: string; pattern: string;
  severity: Passport["triage"]["severity"]; score: number; urgent: boolean;
  injuries: string[]; notes: string; embedding: number[]; imageUrl: string | null;
}): Passport {
  return {
    species: opts.species,
    breed: opts.breed,
    breed_confidence: 0.9,
    coat: { primary_color: opts.primary, secondary_color: null, pattern: opts.pattern, distinctive_markings: null },
    triage: { severity: opts.severity, severity_score: opts.score, observed_injuries: opts.injuries, urgent: opts.urgent, triage_notes: opts.notes },
    biometric: { embedding: opts.embedding, embedding_model: "clip-ViT-B-32", embedding_dim: DIM },
    photo_meta: { image_url: opts.imageUrl, capture_timestamp: new Date().toISOString() },
    raw_llm_response: "[demo seed]",
  };
}

/** Delete all demo rows (adopters → animals → owners). */
export async function wipeDemo(): Promise<void> {
  const sb = getSupabase();
  const NIL = "00000000-0000-0000-0000-000000000000";
  for (const table of ["adopters", "animals", "owners"]) {
    const { error } = await sb.from(table).delete().neq("id", NIL);
    if (error && !/Could not find the table|does not exist/.test(error.message)) {
      throw new Error(`wipe ${table} failed: ${error.message}`);
    }
  }
}

/** Insert the full demo set. Returns the number of animal rows created. */
export async function seedDemo(): Promise<number> {
  let count = 0;
  const ownerIdByName: Record<string, string> = {};

  for (const o of OWNERS) {
    const ownerId = await insertOwner({
      name: o.name, phone: o.phone, email: o.email,
      registered_pets: [{ name: o.pet.name, breed: o.pet.breed, species: o.pet.species, sex: o.pet.sex, coat: o.pet.coat }],
    });
    ownerIdByName[o.name] = ownerId;
    const emb = mockEmbedding(`${o.name}:${o.pet.name}`);
    await insertAnimal({
      passport: passport({ species: o.pet.species, breed: o.pet.breed, primary: o.pet.coat, pattern: o.pet.pattern, severity: "healthy", score: 0, urgent: false, injuries: [], notes: "Registered owner pet.", embedding: emb, imageUrl: null }),
      embedding: emb, ownerId, chipNumber: o.chip, status: "registered",
    });
    count++;
  }

  // Found animals A–D
  const sophieNootje = mockEmbedding("Sophie van der Berg:Nootje");

  // A — Golden Retriever, mild, matched (Sophie) via chip + visual
  await insertAnimal({
    passport: passport({ species: "dog", breed: "Golden Retriever", primary: "golden", pattern: "solid", severity: "minor", score: 1, urgent: false, injuries: ["small graze on right ear"], notes: "Alert and friendly. Minor graze, otherwise healthy.", embedding: perturb(sophieNootje), imageUrl: "https://placedog.net/500/500?id=1" }),
    embedding: perturb(sophieNootje), imageUrl: "https://placedog.net/500/500?id=1", chipNumber: "528140000123456", ownerId: ownerIdByName["Sophie van der Berg"], status: "matched",
  });
  count++;

  // B — Tabby cat, moderate, searching
  await insertAnimal({
    passport: passport({ species: "cat", breed: "European Shorthair", primary: "grey", pattern: "tabby", severity: "moderate", score: 2, urgent: false, injuries: ["limping left hind leg", "dehydration"], notes: "Wary but responsive. Possible soft-tissue leg injury. Recommend vet exam within 2 hours.", embedding: seededEmbedding("found-tabby-B"), imageUrl: "https://placekitten.com/500/500" }),
    embedding: seededEmbedding("found-tabby-B"), imageUrl: "https://placekitten.com/500/500", status: "searching",
  });
  count++;

  // C — Labrador mix, healthy, ready for adoption
  await insertAnimal({
    passport: passport({ species: "dog", breed: "Labrador mix", primary: "tan", pattern: "solid", severity: "healthy", score: 0, urgent: false, injuries: [], notes: "Fully recovered, vaccinated, and great with people. Ready for a forever home.", embedding: seededEmbedding("found-lab-C"), imageUrl: "https://placedog.net/500/500?id=3" }),
    embedding: seededEmbedding("found-lab-C"), imageUrl: "https://placedog.net/500/500?id=3", status: "ready_for_adoption",
  });
  count++;

  // D — Mixed breed dog, severe, in care
  await insertAnimal({
    passport: passport({ species: "dog", breed: "Mixed breed", primary: "brown", pattern: "brindle", severity: "critical", score: 3, urgent: true, injuries: ["deep laceration on flank", "suspected fracture front left leg", "shock"], notes: "URGENT: significant trauma. Stabilising; needs immediate veterinary surgery.", embedding: seededEmbedding("found-mixed-D"), imageUrl: "https://placedog.net/500/500?id=4" }),
    embedding: seededEmbedding("found-mixed-D"), imageUrl: "https://placedog.net/500/500?id=4", status: "in_care",
  });
  count++;

  return count;
}
