import Link from "next/link";

export default function NotFound() {
  return (
    <main className="max-w-md mx-auto px-4 py-24 text-center">
      <div className="h-20 w-20 mx-auto rounded-full bg-rescue/10 flex items-center justify-center" aria-hidden>
        <svg className="h-10 w-10 text-rescue" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g stroke="currentColor" strokeWidth="2" opacity="0.6"><line x1="14" y1="16" x2="24" y2="30"/><line x1="24" y1="12" x2="24" y2="30"/><line x1="34" y1="16" x2="24" y2="30"/><line x1="38" y1="26" x2="24" y2="30"/></g>
          <circle cx="14" cy="16" r="3.4" fill="currentColor"/><circle cx="24" cy="12" r="3.4" fill="currentColor"/><circle cx="34" cy="16" r="3.4" fill="currentColor"/><circle cx="38" cy="26" r="3.4" fill="currentColor"/><ellipse cx="24" cy="33" rx="8" ry="7" fill="currentColor"/>
        </svg>
      </div>
      <p className="mt-5 font-display text-5xl font-bold text-slate-brand">404</p>
      <h1 className="mt-2 font-display text-xl font-bold text-slate-brand">This trail went cold</h1>
      <p className="text-slate-brand/60 mt-2">We couldn&apos;t find that page — but every paw finds its way home.</p>
      <Link href="/intake" aria-label="Go back to intake" className="inline-block mt-7 rounded-xl bg-rescue text-white font-display font-semibold px-6 py-3.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
        Go back to intake
      </Link>
    </main>
  );
}
