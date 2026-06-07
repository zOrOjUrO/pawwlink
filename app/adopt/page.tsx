// Public adoption board — animals ready for adoption.
import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { listAnimalsByStatus, type AnimalRecord } from "@/lib/db/supabase";
import type { Passport } from "@/lib/types";
import AdoptForm from "@/components/AdoptForm";

export const runtime = "nodejs";
export const metadata: Metadata = { title: "Adopt a rescue · PawLink", description: "Browse rescued animals ready for adoption at PawLink shelters." };
export const revalidate = 30;

interface Card {
  id: string;
  imageUrl: string | null;
  species: string;
  breed: string;
  coat: string | null;
  notes: string | null;
}

function toCard(a: AnimalRecord): Card {
  const rec = a as Record<string, unknown>;
  const p = (rec.passport ?? {}) as Passport;
  const colour = p.coat?.primary_color ?? (rec.primary_color as string | null) ?? null;
  const pattern = p.coat?.pattern ?? null;
  const coat = [colour, pattern].filter(Boolean).join(", ") || null;
  return {
    id: a.id,
    imageUrl: (rec.image_url as string | null) ?? p.photo_meta?.image_url ?? null,
    species: p.species ?? (rec.species as string | null) ?? "Animal",
    breed: p.breed ?? (rec.breed as string | null) ?? "Unknown breed",
    coat,
    notes: p.triage?.triage_notes ?? (rec.triage_notes as string | null) ?? null,
  };
}

export default async function AdoptPage() {
  let cards: Card[] = [];
  let error: string | null = null;
  try {
    cards = (await listAnimalsByStatus("ready_for_adoption", 100)).map(toCard);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load adoptable animals.";
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-meadow">Find your next companion</h1>
          <p className="text-slate-brand/60 mt-1">These rescued animals are healthy, recovered, and ready for a loving home.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href="/owner/search" className="rounded-lg border border-mist bg-white px-3 py-2 text-slate-brand hover:bg-cloud">Lost a pet?</Link>
          <Link href="/intake" className="rounded-lg border border-mist bg-white px-3 py-2 text-slate-brand hover:bg-cloud">Work at a shelter?</Link>
        </div>
      </div>

      {error && <div className="rounded-xl border border-signal/40 bg-signal/10 text-signal px-4 py-3 text-sm mb-4">{error}</div>}

      {cards.length === 0 && !error ? (
        <div className="rounded-2xl border border-mist bg-white p-12 text-center text-slate-brand/50">
          No animals ready for adoption right now — check back soon 🐾
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {cards.map((c) => (
            <div key={c.id} className="rounded-2xl border border-mist bg-white shadow-sm overflow-hidden">
              <div className="relative aspect-square bg-cloud overflow-hidden">
                {c.imageUrl ? (
                  <Image src={c.imageUrl} alt={c.breed} fill priority sizes="(max-width: 640px) 100vw, 360px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-brand/30">no photo</div>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-display font-bold text-lg text-slate-brand">{c.breed}</h2>
                <p className="text-sm text-slate-brand/60 capitalize">{c.species}{c.coat ? ` · ${c.coat}` : ""}</p>
                {c.notes && <p className="text-sm text-slate-brand/70 mt-2 line-clamp-3">{c.notes}</p>}
                <Link href={`/passport/${c.id}`} className="mt-3 inline-block w-full text-center rounded-xl bg-rescue text-white font-display font-semibold py-2.5 hover:brightness-95">
                  Meet {c.breed}
                </Link>
                <AdoptForm animalId={c.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
