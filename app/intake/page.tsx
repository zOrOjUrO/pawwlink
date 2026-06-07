"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addToQueue, markSynced, markFailed } from "@/lib/offlineQueue";
import { fileToDataUrl } from "@/lib/file";

const ACCEPT = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function IntakePage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [chip, setChip] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const pickFile = useCallback((f: File | undefined | null) => {
    if (!f) return;
    if (!ACCEPT.includes(f.type)) {
      setError("Please use a JPEG, PNG, or WebP photo.");
      return;
    }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || loading) return;
    setError(null);

    // 1. Save to the offline queue FIRST (instant) — never lose an intake.
    const id = crypto.randomUUID();
    const imageDataUrl = await fileToDataUrl(file);
    addToQueue({
      id,
      imageDataUrl,
      chipNumber: chip.trim() || undefined,
      timestamp: new Date().toISOString(),
      status: "pending",
    });

    // 2. Then attempt to sync now.
    setLoading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      if (chip.trim()) form.append("chip_number", chip.trim());

      const res = await fetch("/api/intake", { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        markFailed(id);
        throw new Error(body.error || `Intake failed (${res.status}).`);
      }
      const data = await res.json();
      markSynced(id);
      router.push(`/passport/${data.animal_id}`);
    } catch (err) {
      setLoading(false);
      // Network error → it stays queued; server error → marked failed above.
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      if (offline || (err instanceof TypeError)) {
        setToast("Saved offline — will sync when connected");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-cloud">
      {/* Loading overlay (analysis) */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-slate-brand/70 backdrop-blur-sm flex flex-col items-center justify-center px-6 text-center">
          <div className="h-14 w-14 rounded-full border-4 border-white/30 border-t-amber-alert animate-spin" />
          <p className="mt-6 text-white font-display font-semibold text-lg">Analyzing with Pixtral AI…</p>
          <p className="mt-1 text-white/70 text-sm">Generating the animal&apos;s Digital Passport</p>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-slate-brand text-white px-4 py-3 text-sm shadow-lg">
          {toast} · <a href="/sync" className="underline">View queue</a>
        </div>
      )}

      <div className="flex-1 flex items-start sm:items-center justify-center px-4 pt-6 pb-10">
        <form onSubmit={handleSubmit} className="w-full max-w-xl">
          <div className="mb-5">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-brand">New animal intake</h1>
            <p className="text-slate-brand/60 mt-1">
              Photograph the found or injured animal. PawLink builds its Digital Passport and searches for an owner.
            </p>
          </div>

          <div
            role="button"
            tabIndex={0}
            aria-label="Upload or take a photo of the animal"
            onClick={() => !loading && inputRef.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); if (!loading) setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); if (!loading) pickFile(e.dataTransfer.files?.[0]); }}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-colors min-h-[260px] flex flex-col items-center justify-center bg-white ${
              dragging ? "border-rescue bg-rescue/5" : "border-mist hover:border-rescue/60"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT.join(",")}
              capture="environment"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            {preview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Selected animal" className="max-h-56 rounded-xl object-contain shadow-sm" />
                <p className="mt-4 text-sm text-slate-brand/60">Tap to change</p>
              </>
            ) : (
              <>
                <div className="h-16 w-16 rounded-full bg-rescue/10 flex items-center justify-center">
                  <svg className="h-8 w-8 text-rescue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M12 16V4m0 0L8 8m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="mt-4 font-display font-semibold text-slate-brand text-lg">Drag &amp; drop a photo</p>
                <p className="mt-1 text-sm text-slate-brand/60">or tap to take / choose a photo</p>
                <p className="mt-3 text-xs text-slate-brand/40">JPEG, PNG or WebP</p>
              </>
            )}
          </div>

          <div className="mt-5">
            <label htmlFor="chip" className="block text-sm font-medium text-slate-brand mb-1.5">
              Microchip number <span className="text-slate-brand/40 font-normal">(optional)</span>
            </label>
            <input
              id="chip"
              value={chip}
              onChange={(e) => setChip(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. NL-528210000123456"
              className="w-full rounded-xl border border-mist bg-white px-4 py-3 font-mono text-sm text-slate-brand placeholder:text-slate-brand/30 focus:outline-none focus:ring-2 focus:ring-rescue/40 focus:border-rescue"
            />
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-signal/40 bg-signal/10 text-signal px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            className="mt-6 w-full rounded-xl bg-rescue text-white font-display font-semibold text-lg py-4 shadow-sm transition hover:brightness-95 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing…" : "Identify Animal"}
          </button>

          <p className="mt-4 text-center text-xs text-slate-brand/40">
            Powered by Pixtral AI · works offline · PawLink
          </p>
        </form>
      </div>
    </main>
  );
}
