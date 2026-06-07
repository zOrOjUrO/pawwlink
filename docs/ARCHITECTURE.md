# PawLink — Architecture & Decisions

This document maps each subsystem to its implementation and records **why** each
significant decision was made. It is the reference for new contributors.

## 1. API Gateway — Next.js 15 route handlers
**What:** `app/api/*` — `health`, `intake` (POST), `match/[id]` (GET), `notify` (POST).
All run on the Node.js runtime.

**Decision — one Next.js app instead of a separate FastAPI service.**
We began with a Python/FastAPI backend, then consolidated into a single Next.js app.
*Justification:* one deployment target (Vercel), one language (TypeScript) shared by API
and apps, atomic deploys, and far fewer moving parts to fail during a 24-hour build. The
trade-off — losing Python's ML ecosystem in-process — is acceptable because vision runs as
a remote API (Pixtral) and embeddings are computed in Node.

**Decision — Node runtime, not Edge.** The Supabase service client and the optional
`@xenova` CLIP path need Node APIs; Edge can't run them.

## 2. Vision Engine — Mistral Pixtral
**What:** `lib/vision/*`. `pixtralAnalyze(imageBase64)` calls Mistral with a strict
JSON-only system prompt and validates the result into a `PassportResult`. A `mockAnalyze`
returns a deterministic passport for offline/dev. Switched via `MOCK_VISION`.

**Decision — multimodal LLM (Pixtral) over a bespoke CV stack for the MVP.**
*Justification:* one API call yields species, breed, coat, *and* triage as structured JSON —
weeks of model work compressed into a prompt, ideal for a hackathon. The contract
(`lib/vision/types.ts → PassportResult`) is provider-agnostic, so Maaz's dedicated CV
pipeline can replace Pixtral later without touching the rest of the system.

**Decision — strict JSON contract + runtime validation.** LLMs drift; we validate severity
enums, array shapes, and types and throw on malformed output so bad data never reaches the DB.

## 3. Animal Passport DB — Supabase + pgvector
**What:** `lib/db/*`. `animals` (passport columns + `vector(512)` + full `passport` JSONB),
`owners`, and the `match_animals` cosine RPC.

**Decision — Supabase (managed Postgres) with the `pgvector` extension.**
*Justification:* one product gives relational data, **vector similarity**, object storage, and
auth — on a free tier with a SQL editor. No separate vector DB to operate.

**Decision — store the full passport as JSONB *and* denormalized columns.**
*Justification:* JSONB is the durable source of truth (schema-flexible as the model evolves);
columns enable fast filters/sorts. The data layer is **self-healing**: `insertWithRetry`
drops columns the live table lacks and re-tries, so schema drift never blocks an intake.

## 4. Database Federation
**What:** `lib/matching/federated.ts` (chip registries) + `lib/matching/vector.ts` +
`match_animals` RPC (visual DB).

**Decision — query the three chip registries in parallel (`Promise.all`).**
*Justification:* registries are independent and network-bound; parallel keeps total latency
≈ the slowest call, not the sum. Verified ~140 ms vs ~360 ms serial.

**Decision — mock the external registries for now.** Amivedi/NDG/PetBase have no open sandbox
APIs and require partnership agreements. The **interface** is real and stable; swapping in
live clients is isolated to one module. The **PawLink Visual DB is real** (pgvector cosine).

**Decision — graceful degradation in `/match`.** A missing RPC or column makes visual search
return empty rather than 500, so the chip path (and the demo) always works.

## 5. Notification Service
**What:** `lib/notify/*`. A `Notifier` interface with `sendSms`/`sendEmail`; `MockNotifier`
logs to console and returns success.

**Decision — provider-agnostic interface, mock implementation first.**
*Justification:* a clean seam lets us demo the full reunification flow with zero SMS cost or
third-party flakiness, then drop in Bird / WhatsApp / web-push behind the same interface.

## 6. Embeddings — CLIP optional, deterministic by default
**What:** `embedImage(bytes)` returns a 512-d vector. Real CLIP (`@xenova/transformers`) is
opt-in (`USE_CLIP=true`); the default is a dependency-free deterministic hash embedding.

**Decision — deterministic fallback as the default.**
*Justification:* `@xenova` pulls native `sharp`, which is fragile to install cross-platform and
broke `next dev`. The fallback keeps the app running everywhere and keeps pgvector inserts
valid. It is **not semantic** — real visual matching needs CLIP/DINOv2 (a Maaz task).

## Cross-cutting
- **TypeScript everywhere**, one `PassportResult` contract shared by API, DB, and (future) apps.
- **Brand tokens** in `app/globals.css` (Tailwind v4 `@theme`).
- **Resilience first:** every external dependency (DB schema, vector RPC, vision, notify, CLIP)
  degrades gracefully so a single failure never takes down the demo.
