"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface AnimalResult {
  animal_id: string;
  species: string | null;
  breed: string | null;
  primary_color: string | null;
  image_url: string | null;
  location: string | null;
  created_at: string | null;
}

interface LookupResult {
  found: boolean;
  source?: string | null;
  owner?: { name: string; phone: string; email: string } | null;
}

function dateLabel(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString();
}

export default function OwnerSearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<AnimalResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const [chip, setChip] = useState("");
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [looking, setLooking] = useState(false);

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!q.trim()) return;
    setSearching(true);
    setSearched(false);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
      setSearched(true);
    }
  }

  async function runLookup(e?: React.FormEvent) {
    e?.preventDefault();
    if (!chip.trim()) return;
    setLooking(true);
    setLookup(null);
    try {
      const res = await fetch(`/api/lookup?chip=${encodeURIComponent(chip.trim())}`);
      setLookup(await res.json());
    } catch {
      setLookup({ found: false });
    } finally {
      setLooking(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-mist bg-white px-4 py-3 text-sm text-slate-brand placeholder:text-slate-brand/30 focus:outline-none focus:ring-2 focus:ring-rescue/40 focus:border-rescue";

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-brand">Lost a pet?</h1>
          <p className="text-slate-brand/60 mt-1">Search animals currently in rescue shelters, or look up a microchip.</p>
        </div>
        <Link href="/owner/register" className="shrink-0 rounded-xl bg-amber-alert text-white font-display font-semibold px-4 py-2.5 hover:brightness-95">
          Register your pet
        </Link>
      </div>

      {/* Text search */}
      <form onSubmit={runSearch} className="flex gap-2 mb-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search found animals" placeholder="e.g. golden retriever amsterdam" className={inputCls} />
        <button type="submit" disabled={searching} className="shrink-0 rounded-xl bg-rescue text-white font-display font-semibold px-5 hover:brightness-95 disabled:opacity-50">
          {searching ? "…" : "Search"}
        </button>
      </form>

      {searched && results.length === 0 && (
        <p className="text-sm text-slate-brand/50 mb-6">No found animals match that description yet.</p>
      )}

      {results.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          {results.map((r) => (
            <Link key={r.animal_id} href={`/passport/${r.animal_id}`} className="rounded-2xl border border-mist bg-white shadow-sm overflow-hidden hover:border-rescue/50 transition">
              <div className="relative aspect-[4/3] bg-cloud overflow-hidden">
                {r.image_url ? (
                  <Image src={r.image_url} alt={r.breed ?? "animal"} fill loading="lazy" sizes="(max-width: 640px) 100vw, 320px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-brand/30 text-sm">no photo</div>
                )}
              </div>
              <div className="p-3">
                <p className="font-display font-semibold text-slate-brand truncate">{r.breed ?? "Unknown breed"}</p>
                <p className="text-xs text-slate-brand/60 capitalize">{r.species ?? "—"}{r.primary_color ? ` · ${r.primary_color}` : ""}</p>
                <p className="text-xs text-slate-brand/40 mt-1">
                  {r.location ? `${r.location} · ` : ""}{dateLabel(r.created_at) || "in shelter"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Chip lookup */}
      <div className="rounded-2xl border border-mist bg-white p-5">
        <h2 className="font-display font-semibold text-slate-brand mb-1">Microchip lookup</h2>
        <p className="text-sm text-slate-brand/60 mb-3">Know the chip number? Check the registries directly.</p>
        <form onSubmit={runLookup} className="flex gap-2">
          <input value={chip} onChange={(e) => setChip(e.target.value)} inputMode="numeric" aria-label="Microchip number" placeholder="e.g. 528140000123456" className={inputCls + " font-mono"} />
          <button type="submit" disabled={looking} className="shrink-0 rounded-xl bg-slate-brand text-white font-display font-semibold px-5 hover:brightness-110 disabled:opacity-50">
            {looking ? "…" : "Look up"}
          </button>
        </form>

        {lookup && (
          <div className="mt-4">
            {lookup.found && lookup.owner ? (
              <div className="rounded-xl border border-meadow/40 bg-meadow/10 p-4">
                <p className="font-display font-semibold text-meadow">✓ Registered via {lookup.source}</p>
                <p className="text-sm text-slate-brand mt-1">{lookup.owner.name} · {lookup.owner.phone} · {lookup.owner.email}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-mist bg-cloud p-4 text-sm text-slate-brand/70">
                No registry match for this microchip.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
