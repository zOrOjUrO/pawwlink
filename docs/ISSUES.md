# Seed backlog

Created automatically by `scripts/setup-github.sh`. Owner in brackets.

## Apps (Gokul)
1. **Owner mobile app — register & reunify** `[gokul]` — register pets (photo + chip + contact),
   receive match notifications, confirm/claim flow. App talks only to `/api/*`.
2. **Rescue-worker app (native/PWA)** `[gokul]` — camera intake, offline queue + sync, passport
   & triage view, one-tap notify, shelter dashboard.
3. **Auth & roles** `[gokul]` — Supabase Auth; owner / rescue-worker / shelter-admin roles + RLS.

## Vision (Maaz)
4. **Real embeddings (CLIP/DINOv2)** `[maaz]` — replace the deterministic fallback with semantic
   512-d vectors; verify against `EMBEDDING_DIM`; benchmark match precision/recall.
5. **Dedicated breed classifier** `[maaz]` — augment/replace Pixtral breed field; confidence audit.
6. **Triage calibration** `[maaz]` — validate severity 0–3 against vet-labelled samples.

## Backend (shared)
7. **Integrate real registries** — live Amivedi/NDG/PetBase clients behind `runFederatedQuery`;
   caching, rate limits, per-source fallback to mock.
8. **Real notifications** — Twilio SMS + WhatsApp + web push behind the `Notifier` interface;
   receipts, retries, opt-in/out.
9. **GDPR/compliance** — PII minimization, consent, retention, audit log, EU residency, erasure.
10. **DB migration & RLS** — align live `animals`/`owners` with `schema.sql`; create
    `match_animals` RPC; pgvector index tuning; row-level security.

## Infra / quality
11. **CI/CD** — GitHub Action: typecheck + test + build; Vercel deploy; Supabase migrations.
12. **Test coverage** — e2e intake→match→notify; seed fixtures; error-state coverage.
