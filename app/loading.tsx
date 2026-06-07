export default function Loading() {
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center" aria-busy="true" aria-label="Loading PawLink">
      <svg className="h-12 w-12 text-rescue animate-pulse" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <g stroke="currentColor" strokeWidth="2" opacity="0.6"><line x1="14" y1="16" x2="24" y2="30"/><line x1="24" y1="12" x2="24" y2="30"/><line x1="34" y1="16" x2="24" y2="30"/><line x1="38" y1="26" x2="24" y2="30"/></g>
        <circle cx="14" cy="16" r="3.4" fill="currentColor"/><circle cx="24" cy="12" r="3.4" fill="currentColor"/><circle cx="34" cy="16" r="3.4" fill="currentColor"/><circle cx="38" cy="26" r="3.4" fill="currentColor"/><ellipse cx="24" cy="33" rx="8" ry="7" fill="currentColor"/>
      </svg>
      <p className="mt-4 text-sm text-slate-brand/60 font-display font-medium">Loading PawLink…</p>
    </main>
  );
}
