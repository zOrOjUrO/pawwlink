"use client";

import { useState } from "react";

export default function AdoptForm({ animalId }: { animalId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setState("sending");
    try {
      const res = await fetch(`/api/adopt/${animalId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adopter_name: name, adopter_phone: phone, adopter_email: email }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="mt-3 rounded-xl bg-meadow/15 text-meadow text-sm font-medium px-3 py-2.5">
        ✓ Request sent! The shelter will contact you.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 w-full rounded-xl border border-meadow text-meadow font-display font-semibold py-2.5 hover:bg-meadow/10 transition"
      >
        I want to adopt
      </button>
    );
  }

  const inputCls =
    "w-full rounded-lg border border-mist bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-meadow/40";

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputCls} />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="Phone" className={inputCls} />
      <input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" placeholder="Email" className={inputCls} />
      {state === "error" && <p className="text-xs text-signal">Something went wrong — try again.</p>}
      <button
        type="submit"
        disabled={state === "sending" || !name.trim()}
        className="w-full rounded-lg bg-meadow text-white font-semibold py-2.5 hover:brightness-95 disabled:opacity-50"
      >
        {state === "sending" ? "Sending…" : "Send adoption request"}
      </button>
    </form>
  );
}
