# PawLink — Deployment & Go-Live (Demo)

Single Next.js 15 app on **Vercel**, backed by **Supabase** (Postgres + pgvector +
Storage), with vision by **Mistral**. Built with **Dierenambulance Den Haag**
(configurable) for three audiences: **shelter workers**, **pet parents**, and
**adopters** — selectable via the in-app role switch.

## 0. Accounts you need
- **Supabase** project (free tier) — Postgres + pgvector + Storage.
- **Mistral** API key — a vision-capable model (e.g. `pixtral-12b-2409`).
- **Vercel** account linked to the GitHub repo.

## 1. Database (Supabase SQL editor)
Run `lib/db/schema.sql`. If your `animals` table predates it, also run this
idempotent migration so every column the app writes exists:
```sql
alter table public.animals alter column breed_confidence type real using breed_confidence::real;
alter table public.animals
  add column if not exists primary_color text,
  add column if not exists secondary_color text,
  add column if not exists pattern text,
  add column if not exists distinctive_markings text,
  add column if not exists severity text,
  add column if not exists severity_score int default 0,
  add column if not exists observed_injuries jsonb default '[]'::jsonb,
  add column if not exists urgent boolean default false,
  add column if not exists triage_notes text,
  add column if not exists status_note text,
  add column if not exists raw_llm_response text,
  add column if not exists capture_timestamp timestamptz,
  add column if not exists found_location text,
  add column if not exists owner_id uuid references public.owners(id),
  add column if not exists passport jsonb;

-- lifecycle constraint (includes 'registered' for owner reference pets)
alter table public.animals drop constraint if exists animals_status_check;
alter table public.animals add constraint animals_status_check check (status in
  ('searching','matched','in_care','ready_for_adoption','adopted','reunited','deceased','registered'));

-- adopters table
create table if not exists public.adopters (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid references public.animals(id),
  name text not null, phone text, email text,
  status text default 'pending', created_at timestamptz default now()
);
```
Then create the vector-search RPC (cosine, registered pets only):
```sql
create or replace function public.match_animals(
  query_embedding vector(512), match_threshold real default 0.75, match_count int default 5)
returns table (id uuid, breed text, image_url text, owner_id uuid, similarity real)
language sql stable as $$
  select a.id, a.breed, a.image_url, a.owner_id, 1 - (a.embedding <=> query_embedding) as similarity
  from public.animals a
  where a.embedding is not null and a.owner_id is not null
    and 1 - (a.embedding <=> query_embedding) >= match_threshold
  order by a.embedding <=> query_embedding limit match_count;
$$;
```
Finally ensure the storage bucket exists:
```sql
insert into storage.buckets (id, name, public) values ('animal-photos','animal-photos',true)
on conflict (id) do nothing;
```

## 2. Environment variables (Vercel → Project → Settings → Environment Variables)
| Var | Value | Notes |
|-----|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ…` | public |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ…` | **server only** |
| `EMBEDDING_DIM` | `512` | matches `vector(512)` |
| `MOCK_VISION` | `false` | `true` runs without Mistral |
| `MISTRAL_API_KEY` | `…` | **server only** |
| `MISTRAL_MODEL` | `pixtral-12b-2409` | any vision-capable Mistral model |
| `USE_CLIP` | `false` | `true` = real CLIP embeddings (needs sharp) |
| `NOTIFIER_PROVIDER` | `mock` | console SMS for the demo |
| `NEXT_PUBLIC_APP_URL` | `https://pawlink.vercel.app` | used in notification links |
| `NEXT_PUBLIC_ORG_NAME` | `Dierenambulance Den Haag` | shown on the intake hero |
| `DEMO_MODE` | `true` | enables `/demo` reset in production |

Mirror these in `.env.local` for local dev.

## 3. Deploy
1. Import the repo in Vercel (framework auto-detected as Next.js).
2. Add the env vars above. Set `NEXT_PUBLIC_APP_URL` to the assigned URL after the
   first deploy, then redeploy.
3. CI (`.github/workflows/ci.yml`) runs `tsc --noEmit` + `next build` on push.

## 4. Seed demo data
Two options:
- **From the app:** open `/demo` → **Reset demo data** (requires `DEMO_MODE=true`).
- **CLI:** `npm run seed` (wipes + inserts 3 owners + 4 found animals).

The seed includes the photogenic set: Sophie/Nootje (chip `528140000123456`),
Jan/Grijs, Fatima/Max, plus four found animals demonstrating matched / searching /
ready-for-adoption / urgent-in-care states.

## 5. Validate (go/no-go)
- `GET /api/health` → `{ status:"ok", mock_vision:false, supabase:"connected" }`.
- Role switch (nav) toggles Shelter / Pet parent / Adopter and shows only that
  role's screens.
- **Shelter:** `/intake` → upload a photo → Mistral passport → `/passport/[id]`.
  Chip `528140000123456` → green "reunited" match (Sophie). `/dashboard` shows the
  queue + lifecycle actions.
- **Pet parent:** `/owner/search` text search + chip lookup; `/owner/register`.
- **Adopter:** `/adopt` shows the ready-for-adoption animal; "I want to adopt".
- `tsc --noEmit` and `next build` both pass.

## 6. Demo-day flow (recording)
1. Open `/demo` → **Reset demo data** (clean slate).
2. Role = **Shelter** → `/intake` → **Simulate intake** (or upload) → passport.
3. Enter chip `528140000123456` on a fresh intake → reunited match + auto-notify.
4. `/dashboard` → mark an animal "Ready for adoption".
5. Switch role → **Adopter** → `/adopt` → "I want to adopt".
6. Switch role → **Pet parent** → `/owner/search` → find a found animal.

## Notes
- `/demo` is unlinked (access by URL) and guarded by `DEMO_MODE`.
- Notifications are console-only (`MockNotifier`); swap to Twilio/WhatsApp later.
- External chip registries are mocked; only `528140000123456` resolves (Amivedi).
