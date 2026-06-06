# PawLink — Deployment & Validation (Next.js + Vercel)

How PawLink deploys, how to validate a deployment, and the decisions behind the
setup with their justifications. Optimised for a 24‑hour hackathon: fast, low
cost, reliable demo.

## 1. Architecture at a glance

PawLink is now a single **Next.js 15 (App Router, TypeScript)** app on **Vercel**,
backed by **Supabase**. There is no separate backend service.

| Layer | Service | What runs there |
|-------|---------|-----------------|
| App + API | **Vercel** | Next.js pages + `app/api/*` route handlers (Node runtime) |
| Data | **Supabase** | Postgres + pgvector (embeddings), Storage (photos) |
| Vision | **Mistral Pixtral** | called directly from a route/server action — *mocked for now* |
| Embeddings | **@xenova/transformers** | CLIP ViT‑B‑32 (ONNX) inside the Node route |
| Notifications | **MockNotifier** | console log + fake success (for now) |

```
Browser ──> Next.js (Vercel)
                ├─ app/api/intake   → CLIP embed + (mock) Pixtral → Supabase insert
                ├─ app/api/match/[id] → Supabase pgvector cosine + federated lookup
                └─ app/api/notify   → MockNotifier
                                       Supabase (Postgres + pgvector + Storage)
```

## 2. Key decisions & justifications

**One Next.js app instead of a separate FastAPI service.** Collapsing the API
into `app/api/*` removes a whole deployment target (previously Railway), shares
one TypeScript codebase and one set of env vars, and lets the frontend and API
ship together on every Vercel push. Fewer moving parts = fewer demo failure
modes.

**Node runtime for the API routes (not Edge).** `@xenova/transformers` runs ONNX
+ wasm and needs Node APIs; the Supabase service client also assumes Node. Each
route handler sets `export const runtime = "nodejs"`, and `next.config.ts` marks
`@xenova/transformers` as a `serverExternalPackage` so it isn't bundled. Edge
would be lower-latency but can't run the model.

**Supabase for data.** One managed product gives Postgres **with pgvector** (our
similarity search), **plus object storage** for photos, on a free tier, with a
SQL editor to apply `lib/db/schema.sql`. Self-hosting Postgres + a blob store
would cost hours we don't have.

**Mock vision + mock notifier by default.** Maaz's Python model isn't ready, so
`VISION_PROVIDER=mock` returns a hardcoded passport while the real CLIP embedding
is still computed from the photo — the matching pipeline is fully exercised.
`NOTIFIER_PROVIDER=mock` keeps notifications visible (console + API response)
with zero SMS cost or third-party flakiness during judging. Both swap to real
providers via one env var.

**Secrets stay server-side.** Only `NEXT_PUBLIC_*` values reach the browser
(Supabase URL + anon key). The **service-role key**, `MISTRAL_API_KEY`, and any
future notifier tokens live only in Vercel project env and are read inside Node
route handlers.

## 3. Environment variables (Vercel project settings)

| Var | Example / value | Exposure | Notes |
|-----|-----------------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | public | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | public | client reads only |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | **server** | privileged writes/storage |
| `EMBEDDING_DIM` | `512` | server | must match `vector(512)` in schema |
| `VISION_PROVIDER` | `mock` | server | `pixtral` to go live |
| `MISTRAL_API_KEY` | — | **server** | only if `VISION_PROVIDER=pixtral` |
| `NOTIFIER_PROVIDER` | `mock` | server | only mock today |
| `SHELTER_NAME` | `PawLink Rescue Shelter` | server | SMS copy |
| `CONFIRM_BASE_URL` | `https://pawlink.vercel.app` | server | owner confirm link base |

> Set the same values in `.env.local` for local dev (gitignored).

## 4. Deployment steps

### 4.1 Supabase (data) — first
1. Create a Supabase project; copy the project URL + anon + service-role keys.
2. **SQL Editor** → run `lib/db/schema.sql`. This enables `pgvector`, creates
   `owners` and `animals`, the IVFFlat index, the `match_animals` RPC, and the
   `animal-photos` storage bucket.
3. Seed demo data (3 owners + registered pets with precomputed embeddings):
   call `seedDemoData()` from `lib/db/supabase.ts`. Easiest is a one-off
   `app/api/seed/route.ts` (or a `tsx` script) that runs it once against the
   Supabase env, then remove/guard it.

### 4.2 Vercel (app + API)
1. Import the repo. Framework preset: **Next.js** (auto-detected).
2. Add the env vars from §3.
3. Deploy. Note the URL (e.g. `https://pawlink.vercel.app`) and set it back into
   `CONFIRM_BASE_URL`.

### 4.3 CORS
Not needed for same-origin calls — the browser and `app/api/*` share the Vercel
origin. If a separate client ever calls the API cross-origin, add headers in the
route handlers or `next.config.ts`.

## 5. Validation

### 5.1 API smoke test (after deploy)
```bash
APP=https://pawlink.vercel.app

# Intake a photo -> capture animal_id
curl -s -X POST $APP/api/intake -F "image=@demo.jpg" | tee /tmp/intake.json
ID=$(node -e "console.log(require('/tmp/intake.json').animal_id)")

# Match (federated chip + pgvector visual)
curl -s $APP/api/match/$ID            # -> combined_status: matched|searching|no_match

# Notify
curl -s -X POST $APP/api/notify -H 'Content-Type: application/json' \
  -d "{\"animal_id\":\"$ID\"}"        # -> channel: owner_sms|community_alert
```
(Until the route handlers are implemented they return **501** — that's expected
during scaffolding.)

### 5.2 Match-correctness check
Insert an intake whose embedding matches a seeded registered pet; `match_animals`
should return that pet's `owner_id` with `similarity ≥ ~0.75`. This confirms the
model → embedding → pgvector → owner path end-to-end.

### 5.3 Build gate
```bash
npm run build      # type-checks + compiles all routes; block deploy on failure
```
Recommended: a GitHub Action running `npm run build` on push.

### 5.4 Go/no-go checklist
- [ ] `lib/db/schema.sql` applied; `pgvector` enabled; bucket exists
- [ ] `seedDemoData()` run; 3 owners + registered pets present
- [ ] `npm run build` green
- [ ] Intake → match returns a registered owner for the demo photo
- [ ] `VISION_PROVIDER=mock`, `NOTIFIER_PROVIDER=mock` (no external cost in demo)
- [ ] No secrets in the client bundle (only `NEXT_PUBLIC_*`)

## 6. Rollback & resilience
- **Bad deploy:** Vercel keeps every previous deployment — promote the last green
  build from the dashboard.
- **Provider/model outage:** `mock` providers remove third parties from the live
  path entirely.
- **DB issue:** matching/insert routes fail loudly; the mock vision path still
  proves the UX, and Supabase point-in-time/restore covers data.

## 7. Cost
Vercel + Supabase free tiers cover the hackathon. Mock vision/notifier = zero
per-call cost. Enabling Pixtral (per-request) or a real SMS provider (per-message)
are the only paid components, both off by default.
