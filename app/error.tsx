"use client";

import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="h-16 w-16 mx-auto rounded-full bg-signal/15 flex items-center justify-center text-signal text-3xl">!</div>
      <h1 className="font-display text-2xl font-bold text-slate-brand mt-5">Something went wrong</h1>
      <p className="text-slate-brand/60 mt-2 text-sm">{error.message || "An unexpected error occurred."}</p>
      <div className="mt-8 flex flex-col gap-3">
        <button onClick={reset} className="rounded-xl bg-rescue text-white font-display font-semibold py-3.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
          Try again
        </button>
        <Link href="/intake" className="rounded-xl border border-mist bg-white text-slate-brand font-display font-semibold py-3.5">
          Go to intake
        </Link>
      </div>
    </main>
  );
}
