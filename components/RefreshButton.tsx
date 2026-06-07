"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [spinning, setSpinning] = useState(false);

  function handleRefresh() {
    setSpinning(true);
    startTransition(() => router.refresh());
    setTimeout(() => setSpinning(false), 600);
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isPending}
      aria-label="Refresh queue"
      className="shrink-0 rounded-xl border border-mist bg-white text-slate-brand font-medium px-4 py-2.5 hover:bg-cloud transition disabled:opacity-60 inline-flex items-center gap-2"
    >
      <span className={spinning ? "animate-spin" : ""}>↻</span> Refresh
    </button>
  );
}
