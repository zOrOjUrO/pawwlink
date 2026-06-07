"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getQueue, markSynced, markFailed, type QueuedIntake } from "@/lib/offlineQueue";

async function syncOne(item: QueuedIntake): Promise<void> {
  const blob = await (await fetch(item.imageDataUrl)).blob();
  const file = new File([blob], `intake-${item.id}.jpg`, { type: blob.type || "image/jpeg" });
  const fd = new FormData();
  fd.append("image", file);
  if (item.chipNumber) fd.append("chip_number", item.chipNumber);
  const res = await fetch("/api/intake", { method: "POST", body: fd });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.error || `Sync failed (${res.status})`);
  }
}

const STATUS_CLS: Record<QueuedIntake["status"], string> = {
  pending: "bg-amber-alert/15 text-amber-alert",
  synced: "bg-meadow/15 text-meadow",
  failed: "bg-signal/15 text-signal",
};

export default function SyncPage() {
  const [items, setItems] = useState<QueuedIntake[]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => setItems(getQueue()), []);

  const retry = useCallback(
    async (item: QueuedIntake) => {
      setBusy(true);
      try {
        await syncOne(item);
        markSynced(item.id);
      } catch {
        markFailed(item.id);
      } finally {
        refresh();
        setBusy(false);
      }
    },
    [refresh]
  );

  const syncAll = useCallback(async () => {
    setBusy(true);
    for (const it of getQueue().filter((i) => i.status !== "synced")) {
      try {
        await syncOne(it);
        markSynced(it.id);
      } catch {
        markFailed(it.id);
      }
    }
    refresh();
    setBusy(false);
  }, [refresh]);

  useEffect(() => {
    refresh();
    if (typeof navigator !== "undefined" && navigator.onLine) void syncAll();
  }, [refresh, syncAll]);

  const pending = items.filter((i) => i.status !== "synced").length;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-brand">Sync queue</h1>
          <p className="text-slate-brand/60 mt-1">{pending} awaiting sync · {items.length} total</p>
        </div>
        <button
          onClick={syncAll}
          disabled={busy || pending === 0}
          className="rounded-xl bg-rescue text-white font-display font-semibold px-4 py-2.5 hover:brightness-95 disabled:opacity-40"
        >
          {busy ? "Syncing…" : "Sync all"}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-mist bg-white p-12 text-center text-slate-brand/50">
          Nothing queued. <Link href="/intake" className="text-rescue hover:underline">New intake.</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 rounded-2xl border border-mist bg-white p-3 shadow-sm">
              <div className="h-14 w-14 shrink-0 rounded-xl bg-cloud overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageDataUrl} alt="queued intake" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-brand/70">{new Date(item.timestamp).toLocaleString()}</p>
                {item.chipNumber && <p className="font-mono text-xs text-slate-brand/50">{item.chipNumber}</p>}
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_CLS[item.status]}`}>
                {item.status}
              </span>
              {item.status !== "synced" && (
                <button
                  onClick={() => retry(item)}
                  disabled={busy}
                  className="rounded-lg border border-mist px-3 py-1.5 text-sm font-medium text-slate-brand hover:bg-cloud disabled:opacity-40"
                >
                  Retry
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
