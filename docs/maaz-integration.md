# Integration Contract — Vision Model (Maaz)

PawLink is now **Next.js + TypeScript**. The vision step produces a **Digital
Passport** that the rest of the pipeline (embedding, DB, matching, notify)
consumes. This doc defines the contract so Maaz's model slots in cleanly.

## Where vision plugs in

Two interchangeable providers implement the same interface, selected by the
`VISION_PROVIDER` env var:

- `lib/vision/mock.ts` — `VISION_PROVIDER=mock` (default). Hardcoded passport.
- `lib/vision/pixtral.ts` — `VISION_PROVIDER=pixtral`. Calls Mistral Pixtral.
- **Maaz's model** drops in as a third provider (e.g. `lib/vision/maaz.ts`,
  `VISION_PROVIDER=maaz`) that calls his Python service and maps the response to
  the `Passport` type. The factory lives in `lib/vision/index.ts`.

The TypeScript interface (in `lib/types.ts`):

```ts
export interface VisionAnalyzer {
  analyze(input: AnalyzeInput): Promise<Passport>;
}

export interface AnalyzeInput {
  bytes: Uint8Array;     // raw image bytes from the upload
  mimeType?: string;
  captureTimestamp?: string;
}
```

So whatever the implementation, it receives the image bytes and returns a
`Passport`. If Maaz exposes a Python HTTP endpoint, the provider just POSTs the
image and shapes the JSON into `Passport`.

## The `Passport` contract (must match exactly)

```ts
interface Passport {
  species: string | null;
  breed: string | null;
  breed_confidence: number | null;        // 0.0 - 1.0
  coat: {
    primary_color: string | null;
    secondary_color: string | null;
    pattern: string | null;
    distinctive_markings: string | null;
  };
  triage: {
    severity: "healthy" | "minor" | "moderate" | "critical";
    severity_score: number;                // 0-3
    observed_injuries: string[];           // [] if none
    urgent: boolean;
    triage_notes: string | null;
  };
  biometric: {
    embedding: number[];                   // see note below
    embedding_model: string;               // "clip-ViT-B-32"
    embedding_dim: number;                  // 512
  };
  photo_meta: {
    image_url: string | null;              // leave null — the route sets it
    capture_timestamp: string | null;      // ISO-8601 UTC
  };
  raw_llm_response: string | null;         // raw model text, for debugging
}
```

### Field rules
- `breed_confidence` is **0.0–1.0** (not a percentage).
- `triage.severity` must be one of the four enum values; `severity_score` is
  **0–3** and should agree with it (0 healthy → 3 critical).
- `observed_injuries` is always an array (`[]` when none).
- Strings that are unknown should be `null`, not `""`.

### The embedding — important architectural note
In this Node architecture, the **CLIP ViT‑B‑32 embedding is produced by the app**
(`lib/matching/vector.ts` → `embedImage()`), not by Maaz's model. So:

- Maaz's model should focus on **breed / coat / triage** and may return
  `biometric.embedding` as an **empty array** `[]`. The intake route computes the
  real 512‑float CLIP vector from the photo and fills it in before insert.
- If Maaz *does* return an embedding, it must be **exactly 512 floats,
  L2‑normalized, and CLIP‑compatible**, otherwise pgvector cosine search against
  the seeded owner pets won't be comparable. When in doubt, return `[]` and let
  the app embed.
- `embedding_model` should be `"clip-ViT-B-32"` and `embedding_dim` `512` to match
  `EMBEDDING_DIM` and the `vector(512)` column in `lib/db/schema.sql`.

## Error handling expectations
- **Don't throw on imperfect photos.** For a blurry image, return a best-effort
  passport with `null`/empty fields and a low `breed_confidence`.
- **Throw only on unrecoverable failures** (corrupt image, model/service down).
  The intake route catches it and returns an HTTP error; a thrown error must not
  leave a half-written DB row (the route inserts only after a successful analyze).
- Keep latency reasonable and add your own timeout on remote calls — the request
  awaits the result.

## Summary for Maaz
Deliver a function/service that takes an image and returns JSON matching the
`Passport` shape above — correct `species/breed/breed_confidence`, a valid
`coat` and `triage` block, and `biometric.embedding: []` (the app embeds). Wire
it as a provider in `lib/vision/` and flip `VISION_PROVIDER`. No other changes
are needed on the app side.
