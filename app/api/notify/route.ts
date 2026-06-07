// POST /api/notify — notify a matched owner (SMS) or broadcast a community alert.
import { NextResponse } from "next/server";
import { getSupabase, getAnimalById } from "@/lib/db/supabase";
import { getNotifier } from "@/lib/notify";

export const runtime = "nodejs";

const SHELTER = process.env.SHELTER_NAME ?? "PawLink Rescue Shelter";
const BASE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.CONFIRM_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      animal_id?: string;
      match_type?: string;
      phone?: string;
      email?: string;
    };
    const animalId = body.animal_id;
    const matchType = body.match_type;
    const overridePhone = body.phone?.trim() || null;
    const overrideEmail = body.email?.trim() || null;

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
    const provider = notifier.name;
    let channel: string;
    let message: string;
    let recipient = "registered owner";
    let sent = false;

    if (matchType === "owner") {
      message = `Good news from ${SHELTER}: a ${breed} matching your registered pet may have been found. Confirm here: ${BASE}/confirm/${animalId} — PawLink`;

      let phone = overridePhone;
      let email = overrideEmail;
      if (!phone && !email && animal.owner_id) {
        const { data: owner, error } = await getSupabase()
          .from("owners")
          .select("phone,email")
          .eq("id", animal.owner_id)
          .maybeSingle();
        if (error) throw new Error(error.message);
        phone = (owner?.phone as string | null) ?? null;
        email = (owner?.email as string | null) ?? null;
      }

      if (provider === "email" && email) {
        channel = "owner_email";
        recipient = email;
        const subject = `PawLink: possible match for your ${breed}`;
        sent = await notifier.sendEmail(email, subject, message);
      } else {
        channel = "owner_sms";
        recipient = phone ?? "registered owner";
        sent = await notifier.sendSms(recipient, message);
      }
    } else {
      channel = "community_alert";
      recipient = "community channels";
      message = `🐾 ${SHELTER} alert: a ${breed} is awaiting its owner. Do you recognise this pet? ${BASE}/animal/${animalId} — PawLink`;
      sent = await notifier.sendSms(recipient, message);
    }

    return NextResponse.json({ sent, channel, recipient, message });
  } catch (err) {
    const message = err instanceof Error ? err.message : "notify failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
