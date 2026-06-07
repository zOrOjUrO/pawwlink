"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_CHIP = "528140000123456";

export default function DemoPanel() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function reset() {
    setBusy("reset"); setMsg(null);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      const data = await res.json();
      setMsg(res.ok ? `✓ Demo reset — seeded ${data.seeded} animals` : `✗ ${data.error}`);
    } catch { setMsg("✗ Reset failed"); } finally { setBusy(null); }
  }

  async function simulateIntake() {
    setBusy("intake"); setMsg(null);
    try {
      let file: File;
      try {
        const blob = await (await fetch("https://placedog.net/640/480?id=7")).blob();
        file = new File([blob], "demo-dog.jpg", { type: blob.type || "image/jpeg" });
      } catch {
        // CORS/offline fallback: generate a simple image.
        const c = document.createElement("canvas"); c.width = 480; c.height = 480;
        const ctx = c.getContext("2d")!; ctx.fillStyle = "#1B9C8F"; ctx.fillRect(0, 0, 480, 480);
        const b: Blob = await new Promise((r) => c.toBlob((bb) => r(bb as Blob), "image/jpeg"));
        file = new File([b], "demo.jpg", { type: "image/jpeg" });
      }
      const fd = new FormData(); fd.append("image", file);
      const res = await fetch("/api/intake", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) router.push(`/passport/${data.animal_id}`);
      else setMsg(`✗ ${data.error}`);
    } catch { setMsg("✗ Simulated intake failed"); } finally { setBusy(null); }
  }

  async function copyChip() {
    try { await navigator.clipboard.writeText(DEMO_CHIP); setMsg(`✓ Copied ${DEMO_CHIP}`); }
    catch { setMsg(DEMO_CHIP); }
  }

  const btn = "w-full rounded-xl font-display font-semibold py-3.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50";

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <span className="inline-block rounded-full bg-slate-brand/10 text-slate-brand text-xs font-semibold px-3 py-1 mb-3">Internal · not for judges</span>
      <h1 className="font-display text-2xl font-bold text-slate-brand">Demo control panel</h1>
      <p className="text-slate-brand/60 mt-1 text-sm">Reset and drive the live demo from here.</p>

      {msg && <div className="mt-5 rounded-xl border border-mist bg-white px-4 py-3 text-sm text-slate-brand shadow-sm">{msg}</div>}

      <div className="mt-6 space-y-3">
        <button onClick={reset} disabled={busy !== null} className={`${btn} bg-signal text-white`}>{busy === "reset" ? "Resetting…" : "Reset demo data"}</button>
        <button onClick={simulateIntake} disabled={busy !== null} className={`${btn} bg-rescue text-white`}>{busy === "intake" ? "Submitting…" : "Simulate intake"}</button>
        <button onClick={copyChip} disabled={busy !== null} className={`${btn} border border-mist bg-white text-slate-brand`}>Show demo chip ({DEMO_CHIP})</button>
      </div>
    </main>
  );
}
