"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { relativeTime } from "@/lib/format";

export interface Row {
  id: string;
  imageUrl: string | null;
  species: string;
  breed: string;
  urgent: boolean;
  status: string;
  createdAt: string | null;
}

const norm = (s: string) => (s === "intake" ? "searching" : s);

const STATUS_META: Record<string, { label: string; cls: string; pulse?: boolean; heart?: boolean }> = {
  searching: { label: "Searching", cls: "bg-amber-alert text-white" },
  matched: { label: "Matched", cls: "bg-rescue text-white" },
  in_care: { label: "In care", cls: "bg-slate-brand text-white" },
  ready_for_adoption: { label: "Ready for adoption", cls: "bg-meadow text-white", pulse: true },
  adopted: { label: "Adopted", cls: "bg-meadow text-white" },
  reunited: { label: "Reunited", cls: "bg-meadow text-white", heart: true },
  deceased: { label: "Deceased", cls: "bg-gray-400 text-white" },
};

const TABS: Array<{ key: string; label: string }> = [
  { key: "all", label: "All" },
  { key: "searching", label: "Searching" },
  { key: "matched", label: "Matched" },
  { key: "in_care", label: "In Care" },
  { key: "ready_for_adoption", label: "Ready for Adoption" },
  { key: "adopted_reunited", label: "Adopted/Reunited" },
];

// "Mark as…" options by current status.
function actionsFor(status: string): Array<{ value: string; label: string }> {
  const s = norm(status);
  if (s === "searching" || s === "matched")
    return [
      { value: "reunited", label: "Reunited with owner" },
      { value: "ready_for_adoption", label: "Ready for adoption" },
      { value: "deceased", label: "Deceased" },
    ];
  if (s === "in_care")
    return [
      { value: "ready_for_adoption", label: "Ready for adoption" },
      { value: "reunited", label: "Reunited" },
      { value: "deceased", label: "Deceased" },
    ];
  if (s === "ready_for_adoption")
    return [
      { value: "adopted", label: "Adopted" },
      { value: "in_care", label: "Back to in care" },
    ];
  return [];
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[norm(status)] ?? { label: status, cls: "bg-mist text-slate-brand/60" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.cls} ${meta.pulse ? "animate-pulse" : ""}`}>
      {meta.heart && <span aria-hidden>♥</span>}
      {meta.label}
    </span>
  );
}

export default function DashboardClient({ initialRows, error }: { initialRows: Row[]; error?: string | null }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [tab, setTab] = useState("all");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => setRows(initialRows), [initialRows]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  async function updateStatus(id: string, newStatus: string) {
    const prev = rows.find((r) => r.id === id)?.status;
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: newStatus } : r))); // optimistic
    try {
      const res = await fetch(`/api/animals/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setToast(`Status updated to ${STATUS_META[newStatus]?.label ?? newStatus}`);
      router.refresh();
    } catch {
      setRows((rs) => rs.map((r) => (r.id === id && prev ? { ...r, status: prev } : r))); // revert
      setToast("Could not update status — try again");
    }
  }

  const filtered = rows.filter((r) => {
    const s = norm(r.status);
    if (tab === "all") return true;
    if (tab === "adopted_reunited") return s === "adopted" || s === "reunited";
    return s === tab;
  });

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-slate-brand text-white px-4 py-3 text-sm shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-brand">Animal queue</h1>
          <p className="text-slate-brand/60 mt-1">{filtered.length} shown · {rows.length} total</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => router.refresh()} className="rounded-xl border border-mist bg-white text-slate-brand font-medium px-4 py-2.5 hover:bg-cloud">↻ Refresh</button>
          <Link href="/intake" className="rounded-xl bg-rescue text-white font-display font-semibold px-4 py-2.5 hover:brightness-95">+ New Intake</Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-slate-brand text-white" : "bg-white border border-mist text-slate-brand/70 hover:bg-cloud"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="rounded-xl border border-signal/40 bg-signal/10 text-signal px-4 py-3 text-sm mb-4">{error}</div>}

      {filtered.length === 0 && !error ? (
        <div className="rounded-2xl border border-mist bg-white p-12 text-center text-slate-brand/50">No animals in this view.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const options = actionsFor(r.status);
            return (
              <div key={r.id} className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-mist bg-white p-3 sm:p-4 shadow-sm">
                <Link href={`/passport/${r.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-14 w-14 shrink-0 rounded-xl bg-cloud overflow-hidden flex items-center justify-center">
                    {r.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.imageUrl} alt={r.breed} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-slate-brand/30">no photo</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-slate-brand truncate">{r.breed}</p>
                    <p className="text-sm text-slate-brand/60 capitalize">{r.species}</p>
                  </div>
                </Link>

                {r.urgent && <span className="hidden sm:inline rounded-full bg-signal/15 text-signal text-xs font-semibold px-2.5 py-1">Urgent</span>}
                <StatusBadge status={r.status} />

                {options.length > 0 && (
                  <select
                    aria-label="Mark as"
                    value=""
                    onChange={(e) => e.target.value && updateStatus(r.id, e.target.value)}
                    className="shrink-0 rounded-lg border border-mist bg-white text-sm text-slate-brand px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-rescue/40"
                  >
                    <option value="">Mark as…</option>
                    {options.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                )}

                <span className="hidden sm:inline text-xs text-slate-brand/40 w-14 text-right shrink-0">{relativeTime(r.createdAt, { short: true })}</span>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
