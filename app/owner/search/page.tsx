"use client";

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

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <section className="text-center mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-brand tracking-tight">Lost a pet?</h1>
        <p className="text-slate-brand/60 mt-3">Search animals currently in rescue shelters, or look up a microchip.</p>

        <form onSubmit={runSearch} className="mt-6 max-w-xl mx-auto flex items-center gap-2 rounded-full border border-mist bg-white shadow-sm pl-5 pr-2 py-2 transition-all focus-within:border-rescue focus-within:ring-2 focus-within:ring-rescue/20">
          <svg className="h-5 w-5 text-slate-brand/40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" strokeLinecap="round" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="golden retriever, amsterdam…" className="flex-1 bg-transparent text-sm text-slate-brand placeholder:text-slate-brand/40 focus:outline-none" />
          <button type="submit" disabled={searching} className="shrink-0 rounded-full bg-rescue text-white font-display font-semibold px-5 py-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">{searching ? "…" : "Search"}</button>
        </form>
        <Link href="/owner/register" className="inline-block mt-3 text-sm text-rescue font-medium hover:underline">Register your pet →</Link>
      </section>

      {searched && results.length === 0 && <p className="text-center text-sm text-slate-brand/50 mb-6">No found animals match that description yet.</p>}

      {results.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {results.map((r) => (
            <Link key={r.animal_id} href={`/passport/${r.animal_id}`} className="rounded-2xl border border-mist bg-white shadow-sm overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
              <div className="aspect-[4/3] bg-cloud overflow-hidden">
                {r.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.image_url} alt={r.breed ?? "animal"} className="w-full h-full object-cover" />
                ) : (<div className="w-full h-full flex items-center justify-center text-slate-brand/30 text-sm">no photo</div>)}
              </div>
              <div className="p-3">
                <p className="font-display font-semibold text-slate-brand truncate">{r.breed ?? "Unknown breed"}</p>
                <p className="text-xs text-slate-brand/60 capitalize">{r.species ?? "—"}{r.primary_color ? ` · ${r.primary_color}` : ""}</p>
                <p className="text-xs text-slate-brand/40 mt-1">{r.location ? `${r.location} · ` : ""}{dateLabel(r.created_at) || "in shelter"}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Chip lookup */}
      <div className="rounded-2xl border border-mist bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <svg className="h-5 w-5 text-rescue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="18" height="12" rx="2" /><line x1="7" y1="9" x2="7" y2="15" /><line x1="10" y1="9" x2="10" y2="15" /><line x1="14" y1="9" x2="14" y2="15" /><line x1="17" y1="9" x2="17" y2="15" /></svg>
          <h2 className="font-display font-semibold text-slate-brand">Microchip lookup</h2>
        </div>
        <p className="text-sm text-slate-brand/60 mb-3">Know the chip number? Check the registries directly.</p>
        <form onSubmit={runLookup} className="flex gap-2">
          <input value={chip} onChange={(e) => setChip(e.target.value)} inputMode="numeric" placeholder="528140000123456" className="w-full rounded-xl border border-mist bg-white px-4 py-3 font-mono text-sm transition-all focus:outline-none focus:border-rescue focus:ring-2 focus:ring-rescue/20" />
          <button type="submit" disabled={looking} className="shrink-0 rounded-xl bg-slate-brand text-white font-display font-semibold px-5 hover:brightness-110 disabled:opacity-50">{looking ? "…" : "Look up"}</button>
        </form>

        {lookup && (
          <div className="mt-4 animate-pop">
            {lookup.found && lookup.owner ? (
              <div className="rounded-xl border border-meadow/40 bg-meadow/10 p-4">
                <p className="font-display font-semibold text-meadow">✓ Registered via {lookup.source}</p>
                <p className="text-sm text-slate-brand mt-1">{lookup.owner.name} · {lookup.owner.phone} · {lookup.owner.email}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-mist bg-cloud p-4 text-sm text-slate-brand/70">No registry match for this microchip.</div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
