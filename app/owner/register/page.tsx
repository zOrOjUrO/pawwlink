"use client";

import Link from "next/link";
import { useState } from "react";
import PhotoDropzone from "@/components/PhotoDropzone";
import { SPECIES_OPTIONS } from "@/lib/constants";
import { fileToDataUrl } from "@/lib/file";

export default function OwnerRegisterPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [species, setSpecies] = useState("dog");
  const [breed, setBreed] = useState("");
  const [coat, setCoat] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  async function submit() {
    if (!file) { setError("Please add a photo of your pet."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const imageBase64 = await fileToDataUrl(file);
      const res = await fetch("/api/owners/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, pet: { species, breed, coat, imageBase64 } }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `Registration failed (${res.status}).`);
      }
      const data = await res.json();
      setOwnerId(data.owner_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (ownerId) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="h-16 w-16 mx-auto rounded-full bg-meadow/15 flex items-center justify-center text-meadow text-3xl animate-pop">✓</div>
        <h1 className="font-display text-2xl font-bold text-slate-brand mt-5">{name}, you&apos;re registered</h1>
        <p className="text-slate-brand/60 mt-2">We&apos;ll notify you if your pet is found.</p>
        <p className="font-mono text-xs text-slate-brand/40 mt-4 break-all">owner id: {ownerId}</p>
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/owner/search" className="rounded-xl bg-rescue text-white font-display font-semibold py-3.5">Browse found animals</Link>
          <Link href="/" className="rounded-xl border border-mist bg-white text-slate-brand font-display font-semibold py-3.5">Done</Link>
        </div>
      </main>
    );
  }

  const inputCls = "w-full rounded-xl border border-mist bg-white px-4 py-3 text-sm transition-all focus:outline-none focus:border-rescue focus:ring-2 focus:ring-rescue/20";

  return (
    <main className="max-w-md mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-rescue" : "bg-mist"}`} />
        ))}
      </div>

      <h1 className="font-display text-2xl font-bold text-slate-brand mb-1">Register your pet</h1>
      <p className="text-slate-brand/60 mb-6 text-sm">
        Step {step} of 3 · {step === 1 ? "Your details" : step === 2 ? "Pet details" : "Pet photo"}
      </p>

      {error && <div className="mb-4 rounded-xl border border-signal/40 bg-signal/10 text-signal px-4 py-3 text-sm">{error}</div>}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-brand mb-1.5">Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-brand mb-1.5">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="+31 6 1234 5678" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-brand mb-1.5">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" placeholder="jane@example.com" className={inputCls} />
          </div>
          <button onClick={() => (name.trim() ? setStep(2) : setError("Please enter your name."))} className="w-full rounded-xl bg-rescue text-white font-display font-semibold py-3.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">Continue</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-brand mb-1.5">Species</label>
            <select value={species} onChange={(e) => setSpecies(e.target.value)} className={inputCls + " capitalize"}>
              {SPECIES_OPTIONS.map((s) => (<option key={s} value={s} className="capitalize">{s}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-brand mb-1.5">Breed</label>
            <input value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="e.g. Golden Retriever" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-brand mb-1.5">Coat colour</label>
            <input value={coat} onChange={(e) => setCoat(e.target.value)} placeholder="e.g. golden" className={inputCls} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-mist bg-white text-slate-brand font-display font-semibold py-3.5">Back</button>
            <button onClick={() => setStep(3)} className="flex-1 rounded-xl bg-rescue text-white font-display font-semibold py-3.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">Continue</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <PhotoDropzone onFile={setFile} />
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 rounded-xl border border-mist bg-white text-slate-brand font-display font-semibold py-3.5">Back</button>
            <button onClick={submit} disabled={submitting || !file} className="flex-1 rounded-xl bg-rescue text-white font-display font-semibold py-3.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40">{submitting ? "Registering…" : "Register pet"}</button>
          </div>
        </div>
      )}
    </main>
  );
}
