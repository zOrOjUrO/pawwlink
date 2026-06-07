// POST /api/owners/register — register an owner + reference pet.
import { NextResponse } from "next/server";
import { embedImage } from "@/lib/matching/vector";
import { getSupabase, insertOwner, insertAnimal } from "@/lib/db/supabase";
import type { Passport } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "animal-photos";

interface RegisterBody {
  name?: string;
  phone?: string;
  email?: string;
  pet?: { species?: string; breed?: string; coat?: string; imageBase64?: string };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as RegisterBody;
    const { name, phone, email, pet } = body;

    if (!name || !pet?.imageBase64) {
      return NextResponse.json({ error: "name and pet.imageBase64 are required." }, { status: 400 });
    }

    const raw = pet.imageBase64.replace(/^data:[^;]+;base64,/, "");
    const bytes = new Uint8Array(Buffer.from(raw, "base64"));
    if (bytes.length === 0) {
      return NextResponse.json({ error: "Invalid pet image." }, { status: 400 });
    }

    const embedding = await embedImage(bytes);

    let imageUrl: string | null = null;
    try {
      const sb = getSupabase();
      const key = `owner-${crypto.randomUUID()}.jpg`;
      const { error: upErr } = await sb.storage.from(BUCKET).upload(key, bytes, { contentType: "image/jpeg", upsert: true });
      if (!upErr) imageUrl = sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
    } catch { /* storage optional */ }

    const petMeta = { species: pet.species ?? null, breed: pet.breed ?? null, coat: pet.coat ?? null, image_url: imageUrl };
    const ownerId = await insertOwner({ name, phone, email, registered_pets: [petMeta] });

    const passport: Passport = {
      species: pet.species ?? null,
      breed: pet.breed ?? null,
      breed_confidence: null,
      coat: { primary_color: pet.coat ?? null, secondary_color: null, pattern: null, distinctive_markings: null },
      triage: { severity: "healthy", severity_score: 0, observed_injuries: [], urgent: false, triage_notes: null },
      biometric: { embedding, embedding_model: "clip-ViT-B-32", embedding_dim: embedding.length },
      photo_meta: { image_url: imageUrl, capture_timestamp: new Date().toISOString() },
      raw_llm_response: "[owner registration]",
    };
    await insertAnimal({ passport, embedding, imageUrl, ownerId, status: "registered" });

    return NextResponse.json({ owner_id: ownerId }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "registration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
