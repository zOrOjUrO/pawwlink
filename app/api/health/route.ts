// GET /api/health — quick liveness/readiness check for the demo.
// Returns { status, mock_vision, supabase, timestamp }. Open this first to show
// judges the app is live and wired to Supabase.
import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";
import { isMockVision } from "@/lib/vision";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let supabase: "connected" | "error" = "error";
  try {
    const { error } = await getSupabase().from("animals").select("id").limit(1);
    supabase = error ? "error" : "connected";
  } catch {
    supabase = "error";
  }

  return NextResponse.json({
    status: "ok",
    mock_vision: isMockVision(),
    supabase,
    timestamp: new Date().toISOString(),
  });
}
