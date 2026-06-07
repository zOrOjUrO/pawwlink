# PawLink — Roadmap

## Now → end of hackathon
- [ ] Apply schema migration so the live DB matches `lib/db/schema.sql` (see README/migration).
- [ ] Create the `match_animals` RPC so visual matching is live end-to-end.
- [ ] Polish the three web pages (intake → passport → dashboard) for the demo.
- [ ] Rehearse the demo: `/api/health` → upload photo → passport → chip match → dashboard.

## Phase 1 — Productionize the platform (post-hackathon)
- **Real registry federation.** Replace the Amivedi/NDG/PetBase mocks with live API clients
  behind the existing interface; add caching, rate-limit handling, and per-source fallback.
- **Real notifications.** Implement Bird SMS, WhatsApp Business, and web push behind the
  `Notifier` interface; delivery receipts + retries; opt-in/opt-out.
- **Semantic embeddings.** Swap the deterministic embedding for CLIP/DINOv2 (Maaz), benchmark
  match precision/recall, tune the pgvector index (lists/probes) and thresholds.
- **Auth & roles.** Supabase Auth with owner / rescue-worker / shelter-admin roles and
  row-level security.

## Phase 2 — The two apps (Gokul)
- **Owner mobile app:** register pets (photo + chip), manage profile/contact, receive and
  confirm match notifications, claim flow.
- **Rescue worker app:** native camera intake, offline queue + sync, passport & triage,
  one-tap notify, shelter dashboard.

## Phase 3 — Trust, scale & compliance
- **GDPR/compliance:** PII minimization, explicit consent, data-retention policies, audit
  logging, EU data residency, right-to-erasure.
- **Observability:** structured logging, error tracking, vision/match accuracy dashboards.
- **Scale:** background jobs for embeddings/notifications, horizontal vector search,
  multi-shelter tenancy.
- **Model quality:** vet-validated triage calibration; breed classifier confidence audits;
  noseprint/biometric re-identification research.

## Known limitations (today)
- External registries are mocked; only the demo chip resolves.
- Embeddings are non-semantic unless `USE_CLIP=true` (needs working `sharp`).
- Notifications are console-only (MockNotifier).
- No authentication; the web UI is an unauthenticated MVP.
- Live DB schema has drifted from `schema.sql`; the data layer self-heals but a migration is advised.
