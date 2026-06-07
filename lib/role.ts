// Lightweight client-side role selection (no auth — hackathon scope).
export type Role = "worker" | "pet_parent" | "adopter";

const KEY = "pawlink.role";
export const ROLE_EVENT = "pawlink-role";

export function getRole(): Role {
  if (typeof window === "undefined") return "worker";
  const r = window.localStorage.getItem(KEY);
  return r === "pet_parent" || r === "adopter" || r === "worker" ? r : "worker";
}

export function setRole(role: Role): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, role);
  window.dispatchEvent(new Event(ROLE_EVENT));
}

export const ROLE_HOME: Record<Role, string> = {
  worker: "/intake",
  pet_parent: "/owner/search",
  adopter: "/adopt",
};

export const ROLE_LABEL: Record<Role, string> = {
  worker: "Shelter",
  pet_parent: "Pet parent",
  adopter: "Adopter",
};

export const ROLE_LINKS: Record<Role, Array<{ href: string; label: string }>> = {
  worker: [
    { href: "/intake", label: "New Intake" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/sync", label: "Queue" },
  ],
  pet_parent: [
    { href: "/owner/search", label: "Find my pet" },
    { href: "/owner/register", label: "Register pet" },
  ],
  adopter: [{ href: "/adopt", label: "Adopt" }],
};
