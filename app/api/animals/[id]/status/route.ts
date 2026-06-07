// PATCH /api/animals/[id]/status
// Body: { status: AnimalStatus, note?, owner_id?, adopter_id? }
// Updates animals.status (self-healing). No auth (hackathon scope).
import { NextResponse } from "next/server";
import { updateAnimal } from "@/lib/db/supabase";
import { LIFECYCLE_STATUSES, type AnimalStatus } from "@/lib/constants";

export const runtime = "nodejs";



export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const body = (await req.json().catch(() => ({}))) as {
      status?: string;
      note?: string;
      owner_id?: string;
      adopter_id?: string;
    };
    const status = body.status as AnimalStatus;
    if (!status || !(LIFECYCLE_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${LIFECYCLE_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const fields: Record<string, unknown> = { status };
    if (body.note) fields.status_note = body.note; // dropped automatically if column absent
    if (status === "reunited" && body.owner_id) fields.owner_id = body.owner_id;
    if (status === "adopted" && body.adopter_id) fields.adopter_id = body.adopter_id;

    await updateAnimal(id, fields);
    return NextResponse.json({ success: true, animal_id: id, new_status: status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "status update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
