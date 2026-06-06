// Shelter dashboard — queue of intake animals.
import Link from "next/link";
import { listAnimals, type AnimalRecord } from "@/lib/db/supabase";
import type { Passport } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEVERITY: Record<number, { label: string; cls: string }> = {
  0: { label: "None", cls: "bg-meadow text-white" },
  1: { label: "Mild", cls: "bg-amber-alert text-white" },
  2: { label: "Moderate", cls: "bg-amber-alert text-white brightness-90" },
  3: { label: "Severe", cls: "bg-signal text-white" },
};

const STATUS_CLS: Record<string, string> = {
  intake: "bg-rescue/10 text-rescue",
  matching: "bg-amber-alert/15 text-amber-alert",
  matched: "bg-meadow/15 text-meadow",
  notified: "bg-meadow/15 text-meadow",
  closed: "bg-mist text-slate-brand/60",
};

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const m = Math.floor(Math.max(0, Date.now() - then) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Row {
  id: string;
  imageUrl: string | null;
  species: string;
  breed: string;
  severityScore: number;
  urgent: boolean;
  status: string;
  createdAt: string | null;
}

function toRow(a: AnimalRecord): Row {
  const p = (a.passport ?? {}) as Passport;
  return {
    id: a.id,
    imageUrl: (a.image_url as string | null) ?? p.photo_meta?.image_url ?? null,
    species: p.species ?? (a.species as string | null) ?? "Unknown",
    breed: p.breed ?? (a.breed as string | null) ?? "Unknown breed",
    severityScore: Math.min(3, Math.max(0, p.triage?.severity_score ?? (a.severity_score as number) ?? 0)),
    urgent: p.triage?.urgent ?? Boolean(a.urgent),
    status: (a.status as string | null) ?? "intake",
    createdAt: (a.created_at as string | null) ?? null,
  };
}

export default async function DashboardPage() {
  let rows: Row[] = [];
  let error: string | null = null;
  try {
    const animals = await listAnimals(100);
    rows = animals.map(toRow).filter((r) => r.status !== "registered");
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load animals.";
  }

  const urgentCount = rows.filter((r) => r.urgent || r.severityScore >= 3).length;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-brand">Animal queue</h1>
          <p className="text-slate-brand/60 mt-1">
            {rows.length} in intake
            {urgentCount > 0 && <span className="text-signal font-medium"> · {urgentCount} urgent</span>}
          </p>
        </div>
        <Link href="/intake" className="shrink-0 rounded-xl bg-rescue text-white font-display font-semibold px-4 py-2.5 hover:brightness-95 transition">
          + New Intake
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-signal/40 bg-signal/10 text-signal px-4 py-3 text-sm mb-4">{error}</div>
      )}

      {rows.length === 0 && !error ? (
        <div className="rounded-2xl border border-mist bg-white p-12 text-center text-slate-brand/50">
          No animals in the queue yet.{" "}
          <Link href="/intake" className="text-rescue hover:underline">Add the first intake.</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const sev = SEVERITY[r.severityScore];
            return (
              <Link
                key={r.id}
                href={`/passport/${r.id}`}
                className="flex items-center gap-4 rounded-2xl border border-mist bg-white p-3 sm:p-4 shadow-sm hover:border-rescue/50 transition"
              >
                <div className="h-16 w-16 shrink-0 rounded-xl bg-cloud overflow-hidden flex items-center justify-center">
                  {r.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.imageUrl} alt={r.breed} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-brand/30">no photo</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-display font-semibold text-slate-brand truncate">{r.breed}</p>
                  <p className="text-sm text-slate-brand/60 capitalize">{r.species}</p>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  {r.urgent && <span className="rounded-full bg-signal/15 text-signal text-xs font-semibold px-2.5 py-1">Urgent</span>}
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${sev.cls}`}>{sev.label}</span>
                </div>

                <span className={`hidden sm:inline rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_CLS[r.status] ?? "bg-mist text-slate-brand/60"}`}>
                  {r.status}
                </span>

                <span className="text-xs text-slate-brand/40 w-16 text-right shrink-0">{relativeTime(r.createdAt)}</span>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
