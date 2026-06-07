"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PendingBadge from "@/components/PendingBadge";
import { getRole, setRole, ROLE_EVENT, ROLE_HOME, ROLE_LABEL, ROLE_LINKS, type Role } from "@/lib/role";

function PawMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <g stroke="#1B9C8F" strokeWidth="1.8" opacity="0.75">
        <line x1="14" y1="16" x2="24" y2="30" /><line x1="24" y1="12" x2="24" y2="30" /><line x1="34" y1="16" x2="24" y2="30" /><line x1="38" y1="26" x2="24" y2="30" />
      </g>
      <circle cx="14" cy="16" r="3.4" fill="#1B9C8F" /><circle cx="24" cy="12" r="3.4" fill="#1B9C8F" /><circle cx="34" cy="16" r="3.4" fill="#1B9C8F" /><circle cx="38" cy="26" r="3.4" fill="#F4A340" /><ellipse cx="24" cy="33" rx="8" ry="7" fill="#1B9C8F" />
    </svg>
  );
}

const ROLES: Role[] = ["worker", "pet_parent", "adopter"];

export default function NavBar() {
  const path = usePathname();
  const router = useRouter();
  const [role, setRoleState] = useState<Role>("worker");

  useEffect(() => {
    const update = () => setRoleState(getRole());
    update();
    window.addEventListener(ROLE_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(ROLE_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  function switchRole(r: Role) {
    setRole(r);
    setRoleState(r);
    router.push(ROLE_HOME[r]);
  }

  const links = ROLE_LINKS[role];

  return (
    <nav className="sticky top-0 z-50 h-16 border-b border-mist bg-white/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-3">
        <Link href={ROLE_HOME[role]} className="flex items-center gap-2.5 shrink-0">
          <span className="h-10 w-10 rounded-full bg-rescue/10 flex items-center justify-center"><PawMark /></span>
          <span className="font-display font-bold text-lg text-slate-brand hidden xs:inline sm:inline">PawLink</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Role switch */}
          <div className="flex rounded-full bg-cloud border border-mist p-0.5 text-xs">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => switchRole(r)}
                className={`px-2.5 py-1 rounded-full font-medium transition-colors ${role === r ? "bg-rescue text-white" : "text-slate-brand/60 hover:text-slate-brand"}`}
                title={ROLE_LABEL[r]}
              >
                {ROLE_LABEL[r]}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-1 text-sm">
            {role === "worker" && <PendingBadge />}
            {links.map((l) => {
              const active = path === l.href || path.startsWith(l.href + "/");
              return (
                <Link key={l.href} href={l.href} className={`px-3 py-2 rounded-lg transition-colors ${active ? "text-rescue font-semibold underline underline-offset-8 decoration-2 decoration-rescue" : "text-slate-brand/70 hover:bg-cloud"}`}>
                  {l.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile role links row */}
      <div className="sm:hidden border-t border-mist bg-white/90 backdrop-blur-sm px-4 h-10 flex items-center gap-1 text-sm overflow-x-auto">
        {role === "worker" && <PendingBadge />}
        {links.map((l) => {
          const active = path === l.href || path.startsWith(l.href + "/");
          return (
            <Link key={l.href} href={l.href} className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${active ? "text-rescue font-semibold" : "text-slate-brand/70"}`}>
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
