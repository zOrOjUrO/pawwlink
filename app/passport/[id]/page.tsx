// Digital Passport page — server component.
import type { Metadata } from "next";
// Reads the animal row via server-only Supabase helpers and fetches the match
// result from GET /api/match/[id] (which also triggers the owner notification).

import Link from "next/link";
import NotifyButton from "@/components/NotifyButton";
import { relativeTime } from "@/lib/format";
import { headers } from "next/headers";
import { getAnimalById } from "@/lib/db/supabase";
import type { Passport } from "@/lib/types";

export const runtime = "nodejs";
export const metadata: Metadata = { title: "Digital Passport · PawLink", description: "AI-generated animal passport, triage, and owner match." };
export const dynamic = "force-dynamic";

interface MatchResponse {
  animal_id: string;
  chip_match: { found: boolean; source: string | null; owner: { name: string; phone: string; email: string } | null };
  visual_matches: Array<{ owner_id: string; owner_name: string; confidence: number; matched_pet_breed: string | null }>;
  overall_status: "chip_matched" | "visual_match" | "searching" | "no_match";
  recommended_action: string;
  notified: boolean;
}

async function getMatch(id: string): Promise<MatchResponse | null> {
  try {
    const h = await headers();
    const host = h.get("host");
    if (!host) return null;
    const proto = h.get("x-forwarded-proto") ?? "http";
    const res = await fetch(`${proto}://${host}/api/match/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as MatchResponse;
  } catch {
    return null;
  }
}

const COLOR_HEX: Record<string, string> = {
  golden: "#E8B923", gold: "#E8B923", cream: "#F3E9D2", black: "#1F2A37", white: "#FFFFFF",
  brown: "#7B4B2A", chocolate: "#5B3A21", tan: "#D2B48C", fawn: "#E5C29F", sable: "#6B4A2B",
  grey: "#9CA3AF", gray: "#9CA3AF", silver: "#C8CDD2", red: "#B23A2E", rust: "#B23A2E",
  brindle: "#6B4A2B", merle: "#8AA0B0", blue: "#6B7B8C", apricot: "#F2C396",
};
function colorHex(name: string | null | undefined): string {
  if (!name) return "#D9E0E3";
  const key = name.toLowerCase().trim();
  for (const k of Object.keys(COLOR_HEX)) if (key.includes(k)) return COLOR_HEX[k];
  return "#D9E0E3";
}

const SEVERITY: Record<number, { label: string; cls: string; pulse?: boolean }> = {
  0: { label: "None", cls: "bg-meadow text-white" },
  1: { label: "Mild", cls: "bg-amber-alert text-white" },
  2: { label: "Moderate", cls: "bg-amber-alert text-white brightness-90" },
  3: { label: "Severe", cls: "bg-signal text-white", pulse: true },
};

function Swatch({ name }: { name: string | null | undefined }) {
  if (!name) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-mist bg-white px-2.5 py-1 text-sm">
      <span className="h-4 w-4 rounded-full border border-mist" style={{ backgroundColor: colorHex(name) }} />
      <span className="capitalize text-slate-brand">{name}</span>
    </span>
  );
}

export default async function PassportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const animal = await getAnimalById(id);

  if (!animal) {
    return (
      <main className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-slate-brand">Animal not found</h1>
        <p className="text-slate-brand/60 mt-2">No record exists for this ID.</p>
        <Link href="/intake" className="inline-block mt-6 rounded-xl bg-rescue text-white font-semibold px-5 py-3">
          New Intake
        </Link>
      </main>
    );
  }

  const p = (animal.passport ?? {}) as Passport;
  const imageUrl = (animal.image_url as string | null) ?? p.photo_meta?.image_url ?? null;
  const species = p.species ?? (animal.species as string | null) ?? "Unknown";
  const breed = p.breed ?? (animal.breed as string | null) ?? "Unknown breed";
  const breedConfidence = p.breed_confidence ?? (animal.breed_confidence as number | null) ?? null;
  const coat = p.coat ?? { primary_color: null, secondary_color: null, pattern: null, distinctive_markings: null };
  const triage = p.triage ?? { severity: "minor", severity_score: 0, observed_injuries: [], urgent: false, triage_notes: null };
  const severityScore = Math.min(3, Math.max(0, triage.severity_score ?? (animal.severity_score as number) ?? 0));
  const injuries = triage.observed_injuries ?? [];
  const urgent = triage.urgent ?? Boolean(animal.urgent);
  const notes = triage.triage_notes ?? (animal.triage_notes as string | null) ?? null;
  const createdAt = (animal.created_at as string | null) ?? (animal.capture_timestamp as string | null) ?? null;

  const match = await getMatch(id);
  const sev = SEVERITY[severityScore];
  const pct = breedConfidence != null ? `${Math.round(breedConfidence * 100)}%` : null;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <p className="text-xs uppercase tracking-wide text-rescue font-semibold mb-1">Digital Passport</p>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-brand mb-6">{species} · {breed}</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT — animal card */}
        <section className="bg-white rounded-2xl border border-mist shadow-sm overflow-hidden">
          <div className="bg-cloud aspect-[4/3] flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={`${species} ${breed}`} className="w-full h-full object-cover" />
            ) : (
              <span className="text-slate-brand/30">No photo</span>
            )}
          </div>
          <div className="p-5">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="font-display text-2xl font-bold text-slate-brand">{breed}</h2>
              {pct && (
                <span className="rounded-full bg-rescue/10 text-rescue text-xs font-semibold px-2.5 py-1">
                  {pct} confidence
                </span>
              )}
            </div>
            <p className="text-slate-brand/60 mt-0.5 capitalize">{species}</p>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-brand/50 mb-2">Coat</p>
              <div className="flex flex-wrap gap-2">
                <Swatch name={coat.primary_color} />
                <Swatch name={coat.secondary_color} />
                {coat.pattern && (
                  <span className="inline-flex items-center rounded-full border border-mist bg-white px-2.5 py-1 text-sm capitalize text-slate-brand">
                    {coat.pattern}
                  </span>
                )}
              </div>
              {coat.distinctive_markings && (
                <p className="text-sm text-slate-brand/70 mt-3">
                  <span className="font-medium text-slate-brand">Markings:</span> {coat.distinctive_markings}
                </p>
              )}
            </div>

            <p className="text-xs text-slate-brand/40 mt-5">Intake {relativeTime(createdAt)}</p>
          </div>
        </section>

        {/* RIGHT — status & triage */}
        <section className="space-y-4">
          {urgent && (
            <div className="rounded-xl bg-signal text-white px-4 py-3 font-semibold">
              ⚠ Immediate veterinary attention required
            </div>
          )}

          <div className="bg-white rounded-2xl border border-mist shadow-sm p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-slate-brand">Triage</h3>
              <span className={`inline-flex items-center min-h-[48px] rounded-full px-5 text-base font-semibold ${sev.cls} ${sev.pulse ? "animate-pulse" : ""}`}>
                {sev.label}
              </span>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-brand/50 mb-2">Observed injuries</p>
              {injuries.length ? (
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-brand">
                  {injuries.map((inj, i) => <li key={i}>{inj}</li>)}
                </ul>
              ) : (
                <p className="text-sm text-slate-brand/50">None observed.</p>
              )}
            </div>

            {notes && (
              <div className="mt-4 rounded-xl bg-cloud border border-mist p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-brand/50 mb-1">Triage notes</p>
                <p className="text-sm text-slate-brand">{notes}</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* MATCH SECTION — full width */}
      <section className="mt-6">
        {!match ? (
          <div className="rounded-2xl border border-mist bg-white p-5 text-slate-brand/60">Match lookup unavailable.</div>
        ) : match.overall_status === "chip_matched" ? (
          <div className="rounded-2xl border border-meadow/40 bg-meadow/10 p-5">
            <p className="font-display font-semibold text-meadow text-lg">✓ Owner identified via {match.chip_match.source} registry</p>
            {match.chip_match.owner && (
              <div className="mt-3 text-sm text-slate-brand grid sm:grid-cols-3 gap-2">
                <p><span className="text-slate-brand/50">Name</span><br />{match.chip_match.owner.name}</p>
                <p><span className="text-slate-brand/50">Phone</span><br />{match.chip_match.owner.phone}</p>
                <p><span className="text-slate-brand/50">Email</span><br />{match.chip_match.owner.email}</p>
              </div>
            )}
            <p className="mt-4 font-medium text-slate-brand">{match.recommended_action}</p>
            {match.notified && <NotifiedPill />}
          </div>
        ) : match.overall_status === "visual_match" ? (
          <div className="rounded-2xl border border-rescue/40 bg-rescue/10 p-5">
            <p className="font-display font-semibold text-rescue text-lg">✓ Possible owner match via visual similarity</p>
            {match.visual_matches[0] && (
              <p className="mt-2 text-sm text-slate-brand">
                Top match: <span className="font-semibold">{match.visual_matches[0].owner_name}</span>
                {" · "}{Math.round(match.visual_matches[0].confidence * 100)}% similarity
                {match.visual_matches[0].matched_pet_breed ? ` · ${match.visual_matches[0].matched_pet_breed}` : ""}
              </p>
            )}
            <p className="mt-4 font-medium text-slate-brand">{match.recommended_action}</p>
            {match.notified && <NotifiedPill />}
          </div>
        ) : match.overall_status === "searching" ? (
          <div className="rounded-2xl border border-amber-alert/50 bg-amber-alert/15 p-5">
            <p className="font-display font-semibold text-slate-brand text-lg">Searching registries… Community alert sent</p>
            <p className="mt-2 text-sm text-slate-brand/70">{match.recommended_action}</p>
            {match.notified && <NotifiedPill />}
          </div>
        ) : (
          <div className="rounded-2xl border border-mist bg-white p-5">
            <p className="font-display font-semibold text-slate-brand text-lg">No match found yet</p>
            <p className="mt-2 text-sm text-slate-brand/70">{match.recommended_action}</p>
            {match.notified && <NotifiedPill />}
          </div>
        )}
      </section>

      {/* ONE-TAP NOTIFY */}
      <div className="mt-6">
        <NotifyButton animalId={id} urgent={urgent} />
      </div>

      {/* BOTTOM ACTIONS */}
      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <Link href="/intake" className="flex-1 text-center rounded-xl bg-rescue text-white font-display font-semibold py-3.5 hover:brightness-95 transition">
          New Intake
        </Link>
        <Link href="/dashboard" className="flex-1 text-center rounded-xl border border-mist bg-white text-slate-brand font-display font-semibold py-3.5 hover:bg-cloud transition">
          View Dashboard
        </Link>
      </div>
    </main>
  );
}

function NotifiedPill() {
  return (
    <span className="inline-flex items-center gap-1.5 mt-3 rounded-full bg-meadow/15 text-meadow text-xs font-semibold px-3 py-1">
      <span className="h-1.5 w-1.5 rounded-full bg-meadow" /> Owner notified via SMS
    </span>
  );
}
