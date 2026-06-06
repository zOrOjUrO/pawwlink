# lib/db — Animal Passport DB (Supabase + pgvector)

Persistence for animals and owners, plus vector similarity search.

## Files
- `supabase.ts` — client + helpers: `insertAnimal`, `getAnimalById`, `findSimilarAnimals`,
  `insertOwner`, `listAnimals`, `seedDemoData`, `mockEmbedding`, `toPgVector`.
- `schema.sql` — tables, indexes, the `match_animals` RPC, storage bucket.

## Schema
- `animals` — denormalized passport columns + `embedding vector(512)` + full `passport` JSONB
  + `status`, `owner_id`, timestamps.
- `owners` — name, phone, email, `registered_pets` JSONB.
- `match_animals(query_embedding, threshold, count)` — cosine similarity over registered pets.

## Decisions
- **Supabase + pgvector** — relational + vector + storage + auth in one managed product.
- **JSONB passport + denormalized columns** — JSONB is the durable source of truth; columns
  power fast filters/sorts.
- **Self-healing inserts** — `insertWithRetry` drops unknown columns and rejects-by-type
  columns, then retries, so schema drift (older live tables) never blocks an intake. The full
  record is always preserved in the `passport` JSONB.

## Next steps
- Ship a migration to align the live table with `schema.sql`; add RLS policies.
- Tune the IVFFlat index (`lists`/`probes`) once real (semantic) embeddings land.
- Add `community_alerts` + notification audit tables.
