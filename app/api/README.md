# app/api — API Gateway

Next.js 15 route handlers (Node runtime). The single entry point for apps + web UI.

## Endpoints
- `GET  /api/health` — `{ status, mock_vision, supabase, timestamp }`. Open first in the demo.
- `POST /api/intake` — multipart (image + optional `chip_number`) → upload, analyze (Pixtral),
  embed, persist → `{ animal_id, passport }`.
- `GET  /api/match/[id]` — parallel chip federation + pgvector visual search →
  `{ chip_match, visual_matches[], overall_status, recommended_action, notified }`.
  Auto-POSTs `/api/notify` on an actionable match.
- `POST /api/notify` — `{ animal_id, match_type }` → MockNotifier → `{ sent, channel, message }`.
- `GET  /api/lookup?chip=…` — **pure** federated chip lookup; no photo, no DB write →
  `{ chip, found, source, owner }`. For scan-on-the-spot (rescue worker) without a full intake.
- `GET  /api/search?q=…` — read-only token search over found animals (species/breed/coat/
  markings/location/notes) → `{ query, count, results[], status: "searching" }`. For owners
  browsing without registering.

## Decisions
- **One Next.js app, not a separate backend** — shared TS, one deploy, fewer failure modes.
- **Node runtime** — Supabase service client + optional CLIP need Node, not Edge.
- **Resilience** — match tolerates a failing vector RPC (returns empty rather than 500); the
  chip path always works.

## Next steps
- Add auth (Supabase Auth) + role checks; rate limiting; request validation (zod).
- `GET /api/animals` for the dashboard list (currently read directly via `listAnimals`).
