// GET /api/match/[id] — federated chip lookup (parallel) + pgvector similarity.
//
// 1. Three registry mocks (Amivedi/NDG/PetBase) run IN PARALLEL.
// 2. Vector cosine similarity ALWAYS runs (top 3 candidates) — but a failure
//    there degrades gracefully instead of failing the whole request.
// 3. If chip matches OR a visual match clears 0.82, we auto-POST /api/notify.

import { NextResponse } from "next/server";
import { getSupabase, getAnimalById, findSimilarAnimals, type SimilarAnimal } from "@/lib/db/supabase";
import { runFederatedQuery, type RegistryHit } from "@/lib/matching/federated";
import type { Passport } from "@/lib/types";

export const runtime = "nodejs";

const VISUAL_MATCH_THRESHOLD = 0.82;
const CANDIDATE_FLOOR = 0.5;

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params; // Next.js 15: params is async
  try {
    const animal = await getAnimalById(id);
    if (!animal) {
      return NextResponse.json({ error: `Animal '${id}' not found.` }, { status: 404 });
    }

    const chipNumber = (animal.chip_number as string | null) ?? null;
    const passport = (animal.passport ?? {}) as Passport;
    const embedding = passport.biometric?.embedding ?? [];

    // Run federation (parallel inside) + vector search concurrently; tolerate
    // a vector-search failure (e.g. missing RPC/columns on an older schema).
    const [chipRes, simRes] = await Promise.allSettled([
      runFederatedQuery(chipNumber),
      findSimilarAnimals(embedding, CANDIDATE_FLOOR, 3),
    ]);
    const chipHit: RegistryHit | null = chipRes.status === "fulfilled" ? chipRes.value : null;
    let similar: SimilarAnimal[] = simRes.status === "fulfilled" ? simRes.value : [];
    if (simRes.status === "rejected") {
      console.warn(`[pawlink] visual search unavailable: ${simRes.reason?.message ?? simRes.reason}`);
    }

    // Resolve owner names for the visual candidates (tolerate failure).
    const ownerIds = [...new Set(similar.map((s) => s.owner_id).filter(Boolean))] as string[];
    let ownerNames: Record<string, string> = {};
    if (ownerIds.length) {
      try {
        const { data } = await getSupabase().from("owners").select("id,name").in("id", ownerIds);
        ownerNames = Object.fromEntries(
          ((data ?? []) as Array<{ id: string; name: string }>).map((o) => [o.id, o.name])
        );
      } catch (e) {
        console.warn(`[pawlink] owner lookup failed: ${e instanceof Error ? e.message : e}`);
      }
    }

    const visual_matches = similar
      .filter((s) => s.owner_id)
      .slice(0, 3)
      .map((s) => ({
        owner_id: s.owner_id as string,
        owner_name: ownerNames[s.owner_id as string] ?? "Unknown owner",
        confidence: Number(s.similarity.toFixed(4)),
        matched_pet_breed: s.breed ?? null,
      }));

    const chip_match = {
      found: Boolean(chipHit),
      source: chipHit?.source ?? null,
      owner: chipHit?.owner ?? null,
    };

    const topVisual = visual_matches[0];
    const hasVisualMatch = Boolean(topVisual) && topVisual.confidence > VISUAL_MATCH_THRESHOLD;

    let overall_status: "chip_matched" | "visual_match" | "searching" | "no_match";
    let recommended_action: string;
    if (chip_match.found) {
      overall_status = "chip_matched";
      recommended_action = `Contact owner ${chipHit!.owner.name} via SMS`;
    } else if (hasVisualMatch) {
      overall_status = "visual_match";
      recommended_action = `Contact owner ${topVisual.owner_name} via SMS`;
    } else if (visual_matches.length > 0) {
      overall_status = "searching";
      recommended_action = "Possible matches found — review candidates or broadcast to community";
    } else {
      overall_status = "no_match";
      recommended_action = "No match found — broadcast to community channels";
    }

    // Auto-notify when there is an actionable match (chip OR visual > 0.82).
    let notified = false;
    if (chip_match.found || hasVisualMatch) {
      try {
        const origin = new URL(req.url).origin;
        const r = await fetch(`${origin}/api/notify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animal_id: id, match_type: "owner" }),
        });
        notified = r.ok;
      } catch {
        notified = false;
      }
    }

    return NextResponse.json({
      animal_id: id,
      chip_match,
      visual_matches,
      overall_status,
      recommended_action,
      notified,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "match failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
