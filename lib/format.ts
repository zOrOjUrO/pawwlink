// Formatting helpers.

/** Relative time. `short` → "3m ago"; long (default) → "3 minutes ago". */
export function relativeTime(iso: string | null, opts?: { short?: boolean }): string {
  if (!iso) return opts?.short ? "—" : "just now";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return opts?.short ? "—" : "just now";
  const m = Math.floor(Math.max(0, Date.now() - t) / 60000);
  const short = opts?.short ?? false;
  if (m < 1) return "just now";
  if (m < 60) return short ? `${m}m ago` : `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return short ? `${h}h ago` : `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return short ? `${d}d ago` : `${d} day${d === 1 ? "" : "s"} ago`;
}
