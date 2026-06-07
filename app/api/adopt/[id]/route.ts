// POST /api/adopt/[id] — register adoption interest.
// Body: { adopter_name, adopter_phone, adopter_email }
import { NextResponse } from "next/server";
import { insertAdopter, updateAnimal } from "@/lib/db/supabase";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const body = (await req.json().catch(() => ({}))) as {
      adopter_name?: string;
      adopter_phone?: string;
      adopter_email?: string;
    };
    if (!body.adopter_name) {
      return NextResponse.json({ error: "adopter_name is required." }, { status: 400 });
    }

    await insertAdopter({
      animal_id: id,
      name: body.adopter_name,
      phone: body.adopter_phone,
      email: body.adopter_email,
    });

    // Move the animal to 'matched' (pending shelter confirmation). Non-fatal.
    try {
      await updateAnimal(id, { status: "matched" });
    } catch {
      /* status update is best-effort */
    }

    return NextResponse.json({
      success: true,
      message: "Shelter will contact you within 24 hours",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "adoption request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
