// POST /api/demo/reset — wipe + re-seed demo data. Guarded.
import { NextResponse } from "next/server";
import { wipeDemo, seedDemo } from "@/lib/db/demoSeed";

export const runtime = "nodejs";
export const maxDuration = 60;

function allowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.DEMO_MODE === "true";
}

export async function POST() {
  if (!allowed()) {
    return NextResponse.json({ error: "Demo reset is disabled. Set DEMO_MODE=true to enable." }, { status: 403 });
  }
  try {
    await wipeDemo();
    const seeded = await seedDemo();
    return NextResponse.json({ success: true, seeded });
  } catch (err) {
    const message = err instanceof Error ? err.message : "reset failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
