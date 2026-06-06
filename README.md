# 🐾 PawLink

**Every paw, back home.** — AI-powered animal rescue intake & owner-reunification platform.

A rescue worker photographs a found or injured animal. PawLink instantly generates a
**Digital Passport** (breed, coat, triage severity), searches **federated pet registries**
by microchip *and* by **visual similarity** (pgvector), and **notifies the owner** — or
broadcasts a community alert if no owner is found.

> Built at **HackDelft 2026** by a two-person CESE team — Gokul (apps + platform) & Maaz (vision/AI).

---

## Why it matters
Shelters lose critical hours manually triaging animals and phoning registries one by one.
Microchips only help if the animal *has* one and it's registered in the *right* database.
PawLink collapses intake → identification → reunification into seconds, and adds a
**visual fallback** so even un-chipped animals can be matched to a registered pet.

---

## System architecture

```
 Mobile App (Owner)          Rescue Worker App
       |                           |
       v                           v
 ┌─────────────────────────────────────────┐
 │            PawLink API Gateway            │   ← Next.js 15 route handlers
 │        (GDPR-minded, TypeScript)          │
 └───────┬──────────────┬────────────────────┘
         |              |
    ┌────v────┐   ┌─────v───────────────────┐
    │ Vision  │   │  Database Federation    │
    │ Engine  │   │  - Amivedi  (mock)      │
    │(Pixtral)│   │  - NDG / PetBase (mock) │
    └────┬────┘   │  - PawLink Visual DB ✅  │
         |        └──────────┬──────────────┘
    ┌────v────────────────┐  |
    │  Animal Passport DB  │◄─┘
    │ (Supabase + pgvector)│
    └────┬─────────────────┘
         |
    ┌────v──────────────────────┐
    │   Notification Service     │
    │  SMS / Push / WhatsApp     │
    └────────────────────────────┘
```

## Status at a glance

| Subsystem | Status | Notes |
|-----------|--------|-------|
| API Gateway | ✅ **Done** | Next.js 15 App Router route handlers (`/api/health`, `/intake`, `/match`, `/notify`) |
| Vision Engine | ✅ **Done (live)** | Mistral **Pixtral** vision → passport JSON; biometric embedding (CLIP opt-in / deterministic fallback) |
| Animal Passport DB | ✅ **Done** | Supabase Postgres + **pgvector(512)** |
| Federation — PawLink Visual DB | ✅ **Done** | pgvector cosine similarity (`match_animals` RPC) |
| Federation — Amivedi / NDG / PetBase | 🟡 **Mocked** | 3 registries queried **in parallel**; demo chip resolves via Amivedi. Real APIs not yet integrated |
| Notification Service | 🟡 **Skeleton** | Provider-agnostic `Notifier`; **MockNotifier** (console) live. Twilio/WhatsApp/push pending |
| Rescue Worker UI (web MVP) | ✅ **Done** | Intake / Passport / Dashboard pages |
| Owner mobile app | ❌ **Not started** | Gokul |
| Rescue worker native app | ❌ **Not started** | Gokul |
| Auth / roles / GDPR | ❌ **Not started** | See roadmap |

## Tech stack
Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres + pgvector) ·
Mistral Pixtral (vision) · Vercel.

## Quickstart
```bash
cp .env.example .env.local      # fill Supabase URL/keys + MISTRAL_API_KEY
# apply lib/db/schema.sql in the Supabase SQL editor
npm install
npm run seed                    # 3 owners + registered pets + 1 demo "found" animal
npm run dev                     # http://localhost:3000
```
Open `/api/health` first to confirm Supabase + vision are live, then `/intake`.
**Demo chip `528140000123456`** resolves to owner *Sophie van der Berg* via the Amivedi mock.

## Documentation
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — subsystems + design decisions & justifications
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — next steps (hackathon → production)
- [`docs/deployment.md`](docs/deployment.md) — Vercel + Supabase deploy & validation
- [`docs/maaz-integration.md`](docs/maaz-integration.md) — vision model contract
- [`docs/brand-identity.md`](docs/brand-identity.md) — brand
- Subsystem READMEs: [`lib/vision`](lib/vision/README.md) · [`lib/db`](lib/db/README.md) · [`lib/matching`](lib/matching/README.md) · [`lib/notify`](lib/notify/README.md) · [`app/api`](app/api/README.md)
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — how Gokul & Maaz split the work

## License
MIT (placeholder) — see `LICENSE`.
