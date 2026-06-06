// POST /api/notify — notify a matched owner (SMS) or broadcast a community alert.
import { NextResponse } from "next/server";
import { getAnimalById } from "@/lib/db/supabase";
import { getNotifier } from "@/lib/notify";

export const runtime = "nodejs";

const SHELTER = process.env.SHELTER_NAME ?? "PawLink Rescue Shelter";
const BASE = (process.env.CONFIRM_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { animal_id?: string; match_type?: string };
    const animalId = body.animal_id;
    const matchType = body.match_type;

    if (!animalId) {
      return NextResponse.json({ error: "animal_id is required." }, { status: 400 });
    }
    if (matchType !== "owner" && matchType !== "community") {
      return NextResponse.json({ error: "match_type must be 'owner' or 'community'." }, { status: 400 });
    }

    const animal = await getAnimalById(animalId);
    if (!animal) {
      return NextResponse.json({ error: `Animal '${animalId}' not found.` }, { status: 404 });
    }
    const breed = (animal.breed as string | null) ?? "animal";

    const notifier = getNotifier();
    let channel: string;
    let message: string;
    let recipient: string;

    if (matchType === "owner") {
      channel = "owner_sms";
      recipient = "registered owner";
      message = `Good news from ${SHELTER}: a ${breed} matching your registered pet may have been found. Confirm here: ${BASE}/confirm/${animalId} — PawLink`;
    } else {
      channel = "community_alert";
      recipient = "community channels";
      message = `🐾 ${SHELTER} alert: a ${breed} is awaiting its owner. Do you recognise this pet? ${BASE}/animal/${animalId} — PawLink`;
    }

    const sent = await notifier.sendSms(recipient, message);
    return NextResponse.json({ sent, channel, message });
  } catch (err) {
    const message = err instanceof Error ? err.message : "notify failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
