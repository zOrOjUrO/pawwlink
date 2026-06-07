# PawLink — Run & Verify

Implementation status: **web MVP complete** — rescue-worker PWA (intake → passport →
dashboard, offline queue) **and** owner flow (register, search, chip lookup). Vision is
live (Pixtral); chip federation + pgvector visual search wired; notifications via
MockNotifier.

## 1. Prerequisites
- Node 20+
- A Supabase project (Postgres + pgvector)
- A Mistral API key (vision)

## 2. Configure
```bash
cp .env.example .env.local
```
Set: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `MISTRAL_API_KEY`, `MOCK_VISION=false`, `EMBEDDING_DIM=512`.

## 3. Database
Run `lib/db/schema.sql` in the Supabase SQL editor. If your `animals` table predates the
current schema, also run this idempotent migration:
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
  add column if not exists raw_llm_response text,
  add column if not exists capture_timestamp timestamptz,
  add column if not exists found_location text,
  add column if not exists owner_id uuid references public.owners(id),
  add column if not exists passport jsonb;
```
Then create the visual-search RPC:
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

## 4. Run
```bash
npm install
npm run seed     # 3 owners + registered pets + 1 demo "found" animal (optional)
npm run dev      # http://localhost:3000
```

## 5. Verify

### Health
- `GET /api/health` → `{ status:"ok", mock_vision:false, supabase:"connected", ... }`

### Rescue-worker flow
1. `/intake` → drag a photo (+ optional chip) → "Identify Animal".
2. Redirects to `/passport/[id]` with the AI passport + triage + match.
3. Use chip **`528140000123456`** → chip-matched to **Sophie van der Berg** (Amivedi).
4. One-tap **Notify owner** on the passport → console logs the SMS; button shows "Notified ✓".
5. `/dashboard` → the animal appears in the queue; **Refresh** re-fetches.

### Offline (PWA)
- Go offline (DevTools → Network → Offline), submit an intake → "Saved offline" toast,
  nav shows "N pending". Go online → `/sync` → **Sync all**.
- Installable: manifest at `/manifest.webmanifest`, `start_url:/intake`.

### Owner flow
- `/owner/register` → 3 steps (details → pet → photo) → `{ owner_id }` + "We'll notify you…".
- `/owner/search` → text search (e.g. "golden retriever") shows found animals;
  microchip lookup (`528140000123456`) shows the registry hit inline.

### API smoke tests
```bash
APP=http://localhost:3000
curl "$APP/api/lookup?chip=528140000123456"      # found:true, Amivedi, Sophie
curl "$APP/api/search?q=golden%20retriever"      # results[] in "searching" status
curl -X POST "$APP/api/owners/register" -H 'Content-Type: application/json' \
  -d '{"name":"Test","pet":{"species":"dog","breed":"Beagle","coat":"tan","imageBase64":"<dataurl>"}}'
```

### Build gate
```bash
npx tsc --noEmit && npm run build   # both must pass (CI runs these)
```

## Notes
- `MOCK_VISION=true` runs without Mistral (hardcoded passport).
- `USE_CLIP=true` enables real CLIP embeddings (needs working `sharp`); default is a
  deterministic fallback so the app runs everywhere.
- External registries (Amivedi/NDG/PetBase) are mocked; only the demo chip resolves.
