// GET /api/search?q=golden+retriever+female+amsterdam
// Text search over found animals (breed, species, coat, markings, location, notes).
// Read-only; returns candidates in "searching" status for owners browsing without
// registering. Token-scored in JS so it tolerates schema drift (reads passport JSONB).
import { NextResponse } from "next/server";
import { listAnimals } from "@/lib/db/supabase";
import type { Passport } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (!q) {
    return NextResponse.json({ query: "", count: 0, results: [], status: "searching" });
  }

  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);

  let animals;
  try {
    animals = await listAnimals(200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const results = animals
    .filter((a) => ((a.status as string | null) ?? "intake") !== "registered")
    .map((a) => {
      const rec = a as Record<string, unknown>;
      const p = (rec.passport ?? {}) as Passport;
      const parts: Array<unknown> = [
        rec.species, rec.breed, rec.primary_color, rec.found_location,
        p.species, p.breed,
        p.coat?.primary_color, p.coat?.secondary_color, p.coat?.pattern, p.coat?.distinctive_markings,
        p.triage?.triage_notes,
      ];
      const hay = parts.filter((x): x is string => typeof x === "string").join(" ").toLowerCase();
      const score = tokens.reduce((n, t) => (hay.includes(t) ? n + 1 : n), 0);
      return { a: rec, p, score };
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, 20)
    .map(({ a, p, score }) => ({
      animal_id: a.id as string,
      species: p.species ?? (a.species as string | null) ?? null,
      breed: p.breed ?? (a.breed as string | null) ?? null,
      primary_color: p.coat?.primary_color ?? (a.primary_color as string | null) ?? null,
      image_url: (a.image_url as string | null) ?? p.photo_meta?.image_url ?? null,
      match_score: score,
      status: "searching" as const,
    }));

  return NextResponse.json({ query: q, count: results.length, results, status: "searching" });
}
