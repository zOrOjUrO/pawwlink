// POST /api/intake — photo upload -> Digital Passport -> persist.
import { NextResponse } from "next/server";
import { analyze } from "@/lib/vision";
import { embedImage } from "@/lib/matching/vector";
import { getSupabase, insertAnimal, EMBEDDING_DIM } from "@/lib/db/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "animal-photos";
const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const image = form.get("image");
    const chipNumber = (form.get("chip_number") as string | null) || null;

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "An 'image' file is required." }, { status: 400 });
    }
    if (!ALLOWED.has(image.type)) {
      return NextResponse.json({ error: `Unsupported image type '${image.type}'.` }, { status: 415 });
    }

    const bytes = new Uint8Array(await image.arrayBuffer());
    if (bytes.length === 0) {
      return NextResponse.json({ error: "Empty image upload." }, { status: 400 });
    }

    const ext = (image.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const key = `${crypto.randomUUID()}.${ext}`;
    const supabase = getSupabase();
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(key, bytes, { contentType: image.type, upsert: true });
    if (upErr) throw new Error(`storage upload failed: ${upErr.message}`);
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(key);
    const imageUrl = pub.publicUrl;

    const imageBase64 = Buffer.from(bytes).toString("base64");
    const passport = await analyze({ imagePath: key, imageBase64 });

    let embedding = passport.biometric.embedding;
    if (!embedding || embedding.length !== EMBEDDING_DIM) {
      embedding = await embedImage(bytes);
    }
    passport.biometric.embedding = embedding;
    passport.biometric.embedding_dim = embedding.length;
    passport.photo_meta.image_url = imageUrl;

    const animalId = await insertAnimal({ passport, embedding, imageUrl, chipNumber, status: "searching" });

    return NextResponse.json({ animal_id: animalId, passport }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "intake failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
