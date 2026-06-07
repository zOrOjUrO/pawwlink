"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { pendingCount, QUEUE_EVENT } from "@/lib/offlineQueue";

export default function PendingBadge() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const update = () => setN(pendingCount());
    update();
    window.addEventListener(QUEUE_EVENT, update);
    window.addEventListener("storage", update);
    const t = setInterval(update, 3000);
    return () => {
      window.removeEventListener(QUEUE_EVENT, update);
      window.removeEventListener("storage", update);
      clearInterval(t);
    };
  }, []);
  if (n === 0) return null;
  return (
    <Link href="/sync" className="rounded-full bg-amber-alert text-white text-xs font-semibold px-2.5 py-1 hover:brightness-95" title="Pending offline intakes">
      {n} pending
    </Link>
  );
}
