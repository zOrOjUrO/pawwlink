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
      <button
        disabled
        className="w-full min-h-[56px] rounded-xl bg-meadow text-white font-display font-semibold text-lg"
      >
        Notified ✓
      </button>
    );
  }

  const color = urgent ? "bg-signal" : "bg-rescue";
  const label =
    state === "sending" ? "Notifying…" : state === "error" ? "Retry — notify owner" : "Notify owner";

  return (
    <button
      onClick={notify}
      disabled={state === "sending"}
      className={`w-full min-h-[56px] rounded-xl ${color} text-white font-display font-semibold text-lg hover:brightness-95 active:scale-[0.99] transition disabled:opacity-60`}
    >
      {label}
    </button>
  );
}
