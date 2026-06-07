// DELETE /api/animals/[id] — permanently remove an animal entry.
import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";

export const runtime = "nodejs";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const supabase = getSupabase();
    // Clear dependent adopter rows first (older schemas may lack ON DELETE CASCADE).
    await supabase.from("adopters").delete().eq("animal_id", id);
    const { error } = await supabase.from("animals").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
