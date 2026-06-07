// Supabase client + animal/owner data helpers.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Passport, Severity } from "@/lib/types";
import type { AnimalStatus } from "@/lib/constants";
import { seededEmbedding } from "@/lib/embedding";

export const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM ?? 512);

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env not set (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)."
    );
  }
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

export function toPgVector(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export type { AnimalStatus };

export interface InsertAnimalInput {
  passport: Passport;
  embedding?: number[];
  imageUrl?: string | null;
  chipNumber?: string | null;
  ownerId?: string | null;
  status?: AnimalStatus;
}

export interface InsertOwnerInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  registered_pets?: Array<Record<string, unknown>>;
}

export interface SimilarAnimal {
  id: string;
  species: string | null;
  breed: string | null;
  severity: Severity;
  image_url: string | null;
  owner_id: string | null;
  similarity: number;
}

export type AnimalRecord = Record<string, unknown> & { id: string };

function buildAnimalRow(input: InsertAnimalInput): Record<string, unknown> {
  const p = input.passport;
  const embedding = input.embedding ?? p.biometric?.embedding ?? [];

  if (embedding.length && embedding.length !== EMBEDDING_DIM) {
    throw new Error(
      `embedding dim mismatch: got ${embedding.length}, expected ${EMBEDDING_DIM}.`
    );
  }

  return {
    image_url: input.imageUrl ?? p.photo_meta?.image_url ?? null,
    species: p.species,
    breed: p.breed,
    breed_confidence: p.breed_confidence,
    primary_color: p.coat?.primary_color ?? null,
    secondary_color: p.coat?.secondary_color ?? null,
    pattern: p.coat?.pattern ?? null,
    distinctive_markings: p.coat?.distinctive_markings ?? null,
    embedding: embedding.length ? toPgVector(embedding) : null,
    severity: p.triage?.severity ?? "minor",
    severity_score: p.triage?.severity_score ?? 0,
    observed_injuries: p.triage?.observed_injuries ?? [],
    urgent: p.triage?.urgent ?? false,
    triage_notes: p.triage?.triage_notes ?? null,
    passport: p,
    raw_llm_response: p.raw_llm_response ?? null,
    chip_number: input.chipNumber ?? null,
    owner_id: input.ownerId ?? null,
    status: input.status ?? "intake",
    capture_timestamp: p.photo_meta?.capture_timestamp ?? null,
  };
}

function missingColumn(message: string): string | null {
  const m = message.match(/Could not find the '([^']+)' column/);
  return m ? m[1] : null;
}

// e.g. invalid input syntax for type integer: "0.95"  /  numeric field overflow
function badValue(message: string): string | null {
  const m = message.match(/invalid input syntax for type \w+: "([^"]*)"/);
  return m ? m[1] : null;
}

function keyForValue(row: Record<string, unknown>, value: string): string | null {
  for (const k of Object.keys(row)) {
    const v = row[k];
    if (v !== null && typeof v !== "object" && String(v) === value) return k;
  }
  return null;
}

/**
 * Insert a row, auto-dropping any column the live table doesn't have. This keeps
 * the app resilient when the deployed schema is older than lib/db/schema.sql
 * (the full record is always preserved in the `passport` JSONB column).
 */
async function insertWithRetry(table: string, row: Record<string, unknown>): Promise<string> {
  const sb = getSupabase();
  const working: Record<string, unknown> = { ...row };
  for (let i = 0; i < 12; i++) {
    const { data, error } = await sb.from(table).insert(working).select("id").single();
    if (!error) return (data as { id: string }).id;
    const col = missingColumn(error.message);
    if (col && col in working) {
      delete working[col];
      console.warn(`[pawlink] '${table}' has no '${col}' column — dropping it and retrying.`);
      continue;
    }
    const bad = badValue(error.message);
    if (bad !== null) {
      const k = keyForValue(working, bad);
      if (k) {
        delete working[k];
        console.warn(`[pawlink] '${table}.${k}' rejected value "${bad}" (column type mismatch) — dropping it and retrying.`);
        continue;
      }
    }
    throw new Error(`insert into '${table}' failed: ${error.message}`);
  }
  throw new Error(`insert into '${table}' failed: too many unknown columns.`);
}

export async function insertAnimal(input: InsertAnimalInput): Promise<string> {
  return insertWithRetry("animals", buildAnimalRow(input));
}

export async function getAnimalById(id: string): Promise<AnimalRecord | null> {
  const { data, error } = await getSupabase()
    .from("animals")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getAnimalById failed: ${error.message}`);
  return (data as AnimalRecord) ?? null;
}

export async function updateAnimal(id: string, fields: Record<string, unknown>): Promise<void> {
  const sb = getSupabase();
  const working: Record<string, unknown> = { ...fields };
  for (let i = 0; i < 12; i++) {
    const { error } = await sb.from("animals").update(working).eq("id", id);
    if (!error) return;
    const col = missingColumn(error.message);
    if (col && col in working) {
      delete working[col];
      console.warn(`[pawlink] 'animals' has no '${col}' column — dropping it and retrying.`);
      continue;
    }
    const bad = badValue(error.message);
    if (bad !== null) {
      const k = keyForValue(working, bad);
      if (k) { delete working[k]; continue; }
    }
    throw new Error(`update animal failed: ${error.message}`);
  }
  throw new Error("update animal failed: too many unknown columns.");
}

export async function findSimilarAnimals(
  embedding: number[],
  threshold = 0.75,
  count = 5
): Promise<SimilarAnimal[]> {
  if (!embedding.length) return [];
  const { data, error } = await getSupabase().rpc("match_animals", {
    query_embedding: toPgVector(embedding),
    match_threshold: threshold,
    match_count: count,
  });
  if (error) throw new Error(`findSimilarAnimals failed: ${error.message}`);
  return (data as SimilarAnimal[]) ?? [];
}

export async function listAnimals(limit = 50): Promise<AnimalRecord[]> {
  const sb = getSupabase();
  let res = await sb.from("animals").select("*").order("created_at", { ascending: false }).limit(limit);
  if (res.error) {
    // Older schema may lack created_at — fall back to an unordered select.
    res = await sb.from("animals").select("*").limit(limit);
  }
  if (res.error) throw new Error(`listAnimals failed: ${res.error.message}`);
  return (res.data as AnimalRecord[]) ?? [];
}

export async function insertOwner(input: InsertOwnerInput): Promise<string> {
  return insertWithRetry("owners", {
    name: input.name,
    phone: input.phone ?? null,
    email: input.email ?? null,
    registered_pets: input.registered_pets ?? [],
  });
}

export async function listAnimalsByStatus(status: string, limit = 100): Promise<AnimalRecord[]> {
  const { data, error } = await getSupabase().from("animals").select("*").eq("status", status).limit(limit);
  if (error) throw new Error(`listAnimalsByStatus failed: ${error.message}`);
  return (data as AnimalRecord[]) ?? [];
}

export interface InsertAdopterInput {
  animal_id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
}

export async function insertAdopter(input: InsertAdopterInput): Promise<string> {
  return insertWithRetry("adopters", {
    animal_id: input.animal_id,
    name: input.name,
    phone: input.phone ?? null,
    email: input.email ?? null,
    status: "pending",
  });
}

export function mockEmbedding(seed: string, dim = EMBEDDING_DIM): number[] {
  return seededEmbedding(seed, dim);
}

export const DEMO_OWNERS = [
  { name: "Sanne de Vries", phone: "+31612345678", email: "sanne@example.nl", pets: [{ name: "Bram", breed: "Labrador Retriever", species: "dog" }] },
  { name: "Pieter Jansen", phone: "+31698765432", email: "pieter@example.nl", pets: [{ name: "Loki", breed: "Golden Retriever", species: "dog" }] },
  { name: "Aisha Khan", phone: "+31655512345", email: "aisha@example.nl", pets: [{ name: "Maya", breed: "Border Collie", species: "dog" }] },
];

export interface SeedResult {
  owners: Array<{ id: string; name: string }>;
  pets: Array<{ id: string; ownerId: string; name: string }>;
}

export async function seedDemoData(): Promise<SeedResult> {
  const owners: SeedResult["owners"] = [];
  const pets: SeedResult["pets"] = [];
  for (const owner of DEMO_OWNERS) {
    const ownerId = await insertOwner({
      name: owner.name,
      phone: owner.phone,
      email: owner.email,
      registered_pets: owner.pets,
    });
    owners.push({ id: ownerId, name: owner.name });
    for (const pet of owner.pets) {
      const embedding = mockEmbedding(`${owner.name}:${pet.name}`);
      const passport: Passport = {
        species: pet.species,
        breed: pet.breed,
        breed_confidence: 0.95,
        coat: { primary_color: null, secondary_color: null, pattern: null, distinctive_markings: null },
        triage: { severity: "healthy", severity_score: 0, observed_injuries: [], urgent: false, triage_notes: null },
        biometric: { embedding, embedding_model: "clip-ViT-B-32", embedding_dim: EMBEDDING_DIM },
        photo_meta: { image_url: null, capture_timestamp: new Date().toISOString() },
        raw_llm_response: "[seed] registered owner pet",
      };
      const petId = await insertAnimal({ passport, embedding, ownerId, status: "registered" });
      pets.push({ id: petId, ownerId, name: pet.name });
    }
  }
  return { owners, pets };
}
