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
    if (!ACCEPT.includes(f.type)) { setError("Please use a JPEG, PNG, or WebP photo."); return; }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || loading) return;
    setError(null);
    const id = crypto.randomUUID();
    const imageDataUrl = await fileToDataUrl(file);
    addToQueue({ id, imageDataUrl, chipNumber: chip.trim() || undefined, timestamp: new Date().toISOString(), status: "pending" });
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
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      if (offline || err instanceof TypeError) setToast("Saved offline — will sync when connected");
      else setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <main className="bg-cloud">
      {loading && (
        <div className="fixed inset-0 z-50 bg-slate-brand/70 backdrop-blur-sm flex flex-col items-center justify-center px-6 text-center">
          <div className="h-14 w-14 rounded-full border-4 border-white/30 border-t-amber-alert animate-spin" />
          <p className="mt-6 text-white font-display font-semibold text-lg">Analyzing with Mistral AI…</p>
          <p className="mt-1 text-white/70 text-sm">Generating the animal&apos;s Digital Passport</p>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-slate-brand text-white px-4 py-3 text-sm shadow-lg animate-pop">
          {toast} · <a href="/sync" className="underline">View queue</a>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 pt-10 pb-16">
        {/* Hero */}
        <section className="text-center mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-brand tracking-tight">Every paw, back home.</h1>
          <p className="text-slate-brand/60 mt-3 max-w-lg mx-auto">
            Photograph a found animal — PawLink identifies, matches, and notifies in seconds.
          </p>
          <p className="mt-4 text-xs text-slate-brand/50">
            Built with {process.env.NEXT_PUBLIC_ORG_NAME ?? "Dutch animal rescue organisations"} — for shelter
            workers, pet parents, and adopters.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-mist bg-white shadow-sm p-5 sm:p-6">
          {/* Drop zone */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => !loading && inputRef.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); if (!loading) setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); if (!loading) pickFile(e.dataTransfer.files?.[0]); }}
            className={`group relative cursor-pointer rounded-2xl border-2 border-dashed transition-all p-8 sm:p-10 text-center min-h-[300px] flex flex-col items-center justify-center ${
              dragging ? "border-rescue bg-rescue/5" : "border-rescue/40 hover:border-rescue hover:bg-rescue/[0.03]"
            }`}
          >
            <input ref={inputRef} type="file" accept={ACCEPT.join(",")} capture="environment" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
            {preview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Selected animal" className="max-h-[300px] rounded-2xl object-contain shadow-md" />
                <p className="mt-4 text-sm text-slate-brand/60">Tap to change</p>
              </>
            ) : (
              <>
                <div className="h-20 w-20 rounded-full bg-rescue/10 flex items-center justify-center group-hover:animate-pulse">
                  <svg className="h-10 w-10 text-rescue" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g stroke="currentColor" strokeWidth="2" opacity="0.6"><line x1="14" y1="16" x2="24" y2="30"/><line x1="24" y1="12" x2="24" y2="30"/><line x1="34" y1="16" x2="24" y2="30"/><line x1="38" y1="26" x2="24" y2="30"/></g>
                    <circle cx="14" cy="16" r="3.4" fill="currentColor"/><circle cx="24" cy="12" r="3.4" fill="currentColor"/><circle cx="34" cy="16" r="3.4" fill="currentColor"/><circle cx="38" cy="26" r="3.4" fill="currentColor"/><ellipse cx="24" cy="33" rx="8" ry="7" fill="currentColor"/>
                  </svg>
                </div>
                <p className="mt-5 font-display font-semibold text-slate-brand text-lg">Drop photo here or tap to use camera</p>
                <p className="mt-1 text-sm text-slate-brand/50">JPEG, PNG or WebP</p>
              </>
            )}
          </div>

          {/* Chip */}
          <div className="mt-5">
            <label htmlFor="chip" className="block text-sm font-medium text-slate-brand mb-1.5">Microchip number <span className="text-slate-brand/40 font-normal">(optional)</span></label>
            <input
              id="chip"
              value={chip}
              onChange={(e) => setChip(e.target.value)}
              inputMode="numeric"
              placeholder="528140000123456"
              className="w-full rounded-xl border border-mist bg-white px-4 py-3 font-mono text-sm text-slate-brand placeholder:text-slate-brand/30 transition-all focus:outline-none focus:border-rescue focus:ring-2 focus:ring-rescue/20"
            />
            <p className="mt-1.5 text-xs text-slate-brand/40">15-digit ISO 11784 standard</p>
          </div>

          {error && <div className="mt-4 rounded-xl border border-signal/40 bg-signal/10 text-signal px-4 py-3 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={!file || loading}
            className="mt-6 w-full h-14 rounded-xl bg-rescue text-white font-display font-semibold text-lg shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden><circle cx="6" cy="9" r="1.6"/><circle cx="10" cy="6.5" r="1.6"/><circle cx="14" cy="6.5" r="1.6"/><circle cx="18" cy="9" r="1.6"/><ellipse cx="12" cy="15" rx="4.2" ry="3.4"/></svg>
            {loading ? "Analyzing…" : "Identify Animal"}
            <span aria-hidden>→</span>
          </button>
          <p className="mt-3 text-center text-xs text-slate-brand/40">Powered by Mistral AI · works offline</p>
        </form>
      </div>
    </main>
  );
}
