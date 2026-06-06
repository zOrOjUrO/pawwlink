# lib/matching — Federation & Visual Search

Two matching paths: **microchip federation** and **visual similarity**.

## Files
- `federated.ts` — `mockAmivedi` / `mockNDG` / `mockPetBase` + `runFederatedQuery`
  (all three queried in parallel via `Promise.all`).
- `vector.ts` — `embedImage(bytes)` (CLIP opt-in / deterministic fallback) + `hashEmbedding`,
  thresholds (`HIGH_CONFIDENCE`, `MATCH_THRESHOLD`).

## Decisions
- **Parallel registry lookups** — independent, network-bound; total latency ≈ slowest call.
- **Mocked external registries** — no open sandbox APIs; the interface is real and stable, so
  live clients drop in with no caller changes. Demo chip `528140000123456` → Amivedi hit.
- **PawLink Visual DB is real** — pgvector cosine via `match_animals` (in `lib/db`).
- **Deterministic embedding by default** — `@xenova` CLIP needs native `sharp` (fragile); the
  fallback keeps the app running. Set `USE_CLIP=true` for real semantic vectors.

## Next steps
- Integrate live Amivedi/NDG/PetBase clients (auth, caching, rate limits, fallback).
- Replace deterministic embedding with CLIP/DINOv2; benchmark precision/recall; calibrate 0.82.
