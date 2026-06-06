# lib/vision — Vision Engine

Turns an animal photo into a structured **Digital Passport**.

## Files
- `types.ts` — `PassportResult` contract (source of truth for the passport shape).
- `mock.ts` — `mockAnalyze(imagePath)`: deterministic hardcoded passport (offline/dev).
- `pixtral.ts` — `pixtralAnalyze(imageBase64)`: calls Mistral Pixtral, validates JSON.
- `index.ts` — `analyze()` + `isMockVision()`: toggles mock vs Pixtral via `MOCK_VISION`.

## Contract
```ts
analyze({ imagePath, imageBase64 }) → Promise<PassportResult>
```
`PassportResult` = species, breed, breed_confidence (0–1), coat{…}, triage{severity,
severity_score 0–3, observed_injuries[], urgent, notes}, biometric{embedding[512], …},
photo_meta{…}, raw_llm_response.

## Decisions
- **Multimodal LLM for the MVP** — one Pixtral call returns breed + coat + triage as JSON;
  no bespoke CV training needed in 24h. Provider-agnostic so a dedicated model can replace it.
- **Strict JSON + runtime validation** — severity enums/arrays/types are checked; malformed
  output throws before it can reach the DB.
- **Embedding is owned by `lib/matching`**, not the vision model — Pixtral returns an empty
  embedding; the intake route fills it. Keeps the biometric vector consistent across providers.

## Next steps
- Maaz: replace/augment Pixtral with a dedicated breed classifier + real embeddings.
- Make `MISTRAL_MODEL` selectable per environment (done — env var).
- Add few-shot examples to the prompt to stabilize coat/triage wording.
