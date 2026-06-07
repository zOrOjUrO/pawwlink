// Shelter dashboard — initial server fetch (revalidate 30) + interactive client.
import type { Metadata } from "next";
import { listAnimals, type AnimalRecord } from "@/lib/db/supabase";
import type { Passport } from "@/lib/types";
import DashboardClient, { type Row } from "@/components/DashboardClient";

export const runtime = "nodejs";
export const metadata: Metadata = { title: "Dashboard · PawLink", description: "Animal intake queue and full lifecycle management." };
export const revalidate = 30;

function toRow(a: AnimalRecord): Row {
  const rec = a as Record<string, unknown>;
  const p = (rec.passport ?? {}) as Passport;
  return {
    id: a.id,
    imageUrl: (rec.image_url as string | null) ?? p.photo_meta?.image_url ?? null,
    species: p.species ?? (rec.species as string | null) ?? "Unknown",
    breed: p.breed ?? (rec.breed as string | null) ?? "Unknown breed",
    urgent: p.triage?.urgent ?? Boolean(rec.urgent),
    status: (rec.status as string | null) ?? "searching",
    createdAt: (rec.created_at as string | null) ?? null,
  };
}

export default async function DashboardPage() {
  let rows: Row[] = [];
  let error: string | null = null;
  try {
    rows = (await listAnimals(200)).map(toRow).filter((r) => r.status !== "registered");
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load animals.";
  }
  return <DashboardClient initialRows={rows} error={error} />;
}
