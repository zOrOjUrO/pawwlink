// GET /api/lookup?chip=528140000123456
// Pure federated chip lookup — no photo, no DB write. For scan-on-the-spot.
import { NextResponse } from "next/server";
import { runFederatedQuery } from "@/lib/matching/federated";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const chip = (new URL(req.url).searchParams.get("chip") ?? "").trim();
  if (!chip) {
    return NextResponse.json({ error: "Query param 'chip' is required." }, { status: 400 });
  }

  try {
    const hit = await runFederatedQuery(chip); // queries Amivedi/NDG/PetBase in parallel
    if (!hit) {
      return NextResponse.json({
        chip,
        found: false,
        source: null,
        owner: null,
        message: "No registry match for this microchip.",
      });
    }
    return NextResponse.json({
      chip,
      found: true,
      source: hit.source,
      owner: hit.owner,
      confidence: hit.confidence,
      recommended_action: `Contact owner ${hit.owner.name} via SMS`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
