import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { getAnimalById } from "@/lib/db/supabase";
import { relativeTime } from "@/lib/format";
import type { Passport } from "@/lib/types";
import NotifyButton from "@/components/NotifyButton";

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
  } catch { return null; }
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

const SEV: Record<number, { label: string; border: string; chip: string; pulse?: boolean }> = {
  0: { label: "None", border: "border-l-meadow", chip: "bg-meadow text-white" },
  1: { label: "Mild", border: "border-l-amber-alert", chip: "bg-amber-alert/80 text-white" },
  2: { label: "Moderate", border: "border-l-amber-alert", chip: "bg-amber-alert text-white" },
  3: { label: "Severe", border: "border-l-signal", chip: "bg-signal text-white", pulse: true },
};

function initials(name: string): string {
  return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  return d.length > 4 ? `•••• ${d.slice(-4)}` : "••••";
}

export default async function PassportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const animal = await getAnimalById(id);

  if (!animal) {
    return (
      <main className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-slate-brand">Animal not found</h1>
        <Link href="/intake" className="inline-block mt-6 rounded-xl bg-rescue text-white font-semibold px-5 py-3">New Intake</Link>
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
  const sev = SEV[severityScore];
  const pct = breedConfidence != null ? `${Math.round(breedConfidence * 100)}%` : null;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      {/* HERO */}
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-brand shadow-sm">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={`${species} ${breed}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40">No photo</div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-slate-brand/85 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5">
          <p className="text-xs uppercase tracking-wide text-white/70 font-semibold">Digital Passport</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">{breed}</h1>
          <p className="text-white/80 capitalize">{species}{pct ? ` · ${pct} confidence` : ""}</p>
        </div>
      </div>

      {urgent && (
        <div className="mt-4 rounded-xl bg-signal text-white px-4 py-3 font-semibold animate-pop">
          ⚠ Immediate veterinary attention required
        </div>
      )}

      {/* INFO GRID */}
      <div className="mt-5 grid sm:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-mist bg-white shadow-sm p-5">
          <h2 className="font-display font-semibold text-slate-brand mb-3">Appearance</h2>
          <div className="flex flex-wrap gap-2">
            {coat.primary_color && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-mist bg-white px-2.5 py-1 text-sm">
                <span className="h-4 w-4 rounded-full border border-mist" style={{ backgroundColor: colorHex(coat.primary_color) }} />
                <span className="capitalize text-slate-brand">{coat.primary_color}</span>
              </span>
            )}
            {coat.pattern && <span className="rounded-full border border-mist bg-white px-2.5 py-1 text-sm capitalize text-slate-brand">{coat.pattern}</span>}
          </div>
          {coat.distinctive_markings && <p className="text-sm text-slate-brand/70 mt-3"><span className="font-medium text-slate-brand">Markings:</span> {coat.distinctive_markings}</p>}
          <p className="text-xs text-slate-brand/40 mt-4">Intake {relativeTime(createdAt)}</p>
        </section>

        <section className={`rounded-2xl border border-mist border-l-4 ${sev.border} bg-white shadow-sm p-5`}>
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-slate-brand">Triage</h2>
            <span className={`inline-flex items-center min-h-[44px] rounded-full px-4 text-base font-semibold ${sev.chip} ${sev.pulse ? "animate-pulse" : ""}`}>{sev.label}</span>
          </div>
          <div className="mt-3">
            {injuries.length ? (
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-brand">{injuries.map((inj, i) => <li key={i}>{inj}</li>)}</ul>
            ) : (
              <p className="text-sm text-slate-brand/50">No injuries observed.</p>
            )}
          </div>
          {notes && <div className="mt-3 rounded-xl bg-cloud border border-mist p-3"><p className="text-sm text-slate-brand">{notes}</p></div>}
        </section>
      </div>

      {/* MATCH */}
      <section className="mt-5">
        {!match ? (
          <div className="rounded-2xl border border-mist bg-white p-5 text-slate-brand/60 shadow-sm">Match lookup unavailable.</div>
        ) : match.overall_status === "chip_matched" || match.overall_status === "visual_match" ? (
          <div className="relative overflow-hidden rounded-2xl border border-meadow/40 bg-meadow/10 p-5 animate-pop">
            <div className="pointer-events-none absolute inset-0">
              {[10, 30, 50, 70, 90].map((l, i) => (
                <span key={i} className="confetti absolute h-2 w-2 rounded-sm" style={{ left: `${l}%`, top: "-6px", backgroundColor: ["#1B9C8F", "#F4A340", "#3FB97A"][i % 3], animationDelay: `${i * 0.18}s` }} />
              ))}
            </div>
            <p className="font-display font-semibold text-meadow text-lg">
              {match.overall_status === "chip_matched" ? `✓ Owner identified via ${match.chip_match.source} registry` : "✓ Possible owner match via visual similarity"}
            </p>
            {match.chip_match.owner ? (
              <div className="mt-3 flex items-center gap-3">
                <span className="h-11 w-11 rounded-full bg-meadow/20 text-meadow font-display font-bold flex items-center justify-center">{initials(match.chip_match.owner.name)}</span>
                <div>
                  <p className="font-semibold text-slate-brand">{match.chip_match.owner.name}</p>
                  <p className="text-sm text-slate-brand/60 font-mono">{maskPhone(match.chip_match.owner.phone)}</p>
                </div>
              </div>
            ) : match.visual_matches[0] ? (
              <div className="mt-3 flex items-center gap-3">
                <span className="h-11 w-11 rounded-full bg-meadow/20 text-meadow font-display font-bold flex items-center justify-center">{initials(match.visual_matches[0].owner_name)}</span>
                <div>
                  <p className="font-semibold text-slate-brand">{match.visual_matches[0].owner_name}</p>
                  <p className="text-sm text-slate-brand/60">{Math.round(match.visual_matches[0].confidence * 100)}% visual similarity</p>
                </div>
              </div>
            ) : null}
            <p className="mt-3 font-medium text-slate-brand">{match.recommended_action}</p>
            {match.notified && <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-meadow/15 text-meadow text-xs font-semibold px-3 py-1"><span className="h-1.5 w-1.5 rounded-full bg-meadow" /> Owner notified via SMS</p>}
          </div>
        ) : match.overall_status === "searching" ? (
          <div className="rounded-2xl border border-amber-alert/40 bg-amber-alert/10 p-6 flex items-center gap-5">
            <div className="relative h-16 w-16 shrink-0">
              <span className="radar-ring absolute inset-0 rounded-full border-2 border-rescue" />
              <span className="radar-ring absolute inset-0 rounded-full border-2 border-rescue" style={{ animationDelay: "1s" }} />
              <span className="absolute inset-[38%] rounded-full bg-rescue" />
            </div>
            <div>
              <p className="font-display font-semibold text-slate-brand text-lg">Searching 3 registries…</p>
              <p className="text-sm text-slate-brand/60">Amivedi · NDG · PetBase</p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-mist bg-white p-5 shadow-sm">
            <p className="font-display font-semibold text-slate-brand text-lg">No match found yet</p>
            <p className="mt-2 text-sm text-slate-brand/70">{match.recommended_action}</p>
          </div>
        )}
      </section>

      {/* ACTIONS */}
      <div className="mt-6"><NotifyButton animalId={id} urgent={urgent} /></div>
      <div className="mt-3 flex flex-col sm:flex-row gap-3">
        <Link href="/intake" className="flex-1 text-center rounded-full bg-rescue text-white font-display font-semibold min-h-[48px] flex items-center justify-center transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">New Intake</Link>
        <Link href="/dashboard" className="flex-1 text-center rounded-full border border-mist bg-white text-slate-brand font-display font-semibold min-h-[48px] flex items-center justify-center hover:bg-cloud">View Dashboard</Link>
      </div>
    </main>
  );
}
