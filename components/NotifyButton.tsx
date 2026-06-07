"use client";

import { useState } from "react";

export default function NotifyButton({ animalId, urgent }: { animalId: string; urgent: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function notify() {
    if (state === "sending" || state === "done") return;
    setState("sending");
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animal_id: animalId, match_type: "owner" }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <button disabled className="w-full min-h-[56px] rounded-full bg-meadow text-white font-display font-semibold text-lg animate-pop">
        Notified ✓
      </button>
    );
  }

  const color = urgent ? "bg-signal" : "bg-rescue";
  const label = state === "sending" ? "Notifying…" : state === "error" ? "Retry — notify owner" : "Notify owner";

  return (
    <button
      onClick={notify}
      disabled={state === "sending"}
      className={`w-full min-h-[56px] rounded-full ${color} text-white font-display font-semibold text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60`}
    >
      {label}
    </button>
  );
}
