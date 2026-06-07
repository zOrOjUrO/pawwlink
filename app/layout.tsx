import type { Metadata, Viewport } from "next";
import Link from "next/link";
import PendingBadge from "@/components/PendingBadge";
import "./globals.css";

export const metadata: Metadata = {
  title: "PawLink — Every paw, back home.",
  description: "AI-powered animal rescue intake platform.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "PawLink" },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#1B9C8F",
};

function PawMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <g stroke="#1B9C8F" strokeWidth="1.8" opacity="0.7">
        <line x1="14" y1="16" x2="24" y2="30" />
        <line x1="24" y1="12" x2="24" y2="30" />
        <line x1="34" y1="16" x2="24" y2="30" />
        <line x1="38" y1="26" x2="24" y2="30" />
      </g>
      <circle cx="14" cy="16" r="3.4" fill="#1B9C8F" />
      <circle cx="24" cy="12" r="3.4" fill="#1B9C8F" />
      <circle cx="34" cy="16" r="3.4" fill="#1B9C8F" />
      <circle cx="38" cy="26" r="3.4" fill="#F4A340" />
      <ellipse cx="24" cy="33" rx="8" ry="7" fill="#1B9C8F" />
    </svg>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-cloud text-slate-brand antialiased">
        <nav className="sticky top-0 z-50 h-14 bg-slate-brand text-white flex items-center justify-between px-4 sm:px-6">
          <Link href="/intake" className="flex items-center gap-2">
            <PawMark />
            <span className="font-display font-bold text-lg text-rescue">PawLink</span>
          </Link>
          <div className="flex items-center gap-1 text-sm font-medium">
            <PendingBadge />
            <Link href="/adopt" className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
              Adopt
            </Link>
            <Link href="/owner/search" className="px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors">
              Lost a pet?
            </Link>
            <Link href="/dashboard" className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
              Dashboard
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
