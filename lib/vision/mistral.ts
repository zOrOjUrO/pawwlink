// REAL analyze() — Mistral vision model.
//
// Mistral describes the animal (species/breed/coat/triage). The biometric
// embedding is computed separately via CLIP (lib/matching/vector.ts) and merged
// in the intake route, so we return an empty embedding here.

import type { PassportResult, Severity } from "./types";

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
// Must be a vision-capable Mistral model. Set MISTRAL_MODEL in env to override.
const MODEL = process.env.MISTRAL_MODEL ?? "pixtral-12b-2409";
const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM ?? 512);

const SEVERITIES: Severity[] = ["healthy", "minor", "moderate", "critical"];

const SYSTEM_PROMPT = `You are a veterinary triage assistant for an animal rescue intake system.
Analyze the photo of a found or injured animal and respond with ONLY a single JSON object
(no markdown, no prose, no code fences) using EXACTLY this shape:

{
  "species": string | null,
  "breed": string | null,
  "breed_confidence": number,
  "coat": {
    "primary_color": string | null,
    "secondary_color": string | null,
    "pattern": string | null,
    "distinctive_markings": string | null
  },
  "triage": {
    "severity": "healthy" | "minor" | "moderate" | "critical",
    "severity_score": number,
    "observed_injuries": string[],
    "urgent": boolean,
    "triage_notes": string
  }
}

Rules: breed_confidence is a fraction in [0,1], not a percentage. Use null for
fields you cannot determine. Do not include any keys other than those above.`;

interface MistralCore {
  species: string | null;
  breed: string | null;
  breed_confidence: number;
  coat: PassportResult["coat"];
  triage: Omit<PassportResult["triage"], "severity"> & { severity: string };
}

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function validateCore(raw: unknown): MistralCore {
  if (!isObject(raw)) throw new Error("Mistral response is not a JSON object.");
  const triage = raw.triage;
  const coat = raw.coat;
  if (!isObject(triage)) throw new Error("Mistral response missing valid 'triage'.");
  if (!isObject(coat)) throw new Error("Mistral response missing valid 'coat'.");
  if (!SEVERITIES.includes(triage.severity as Severity)) {
    throw new Error(`Mistral returned invalid severity: ${String(triage.severity)}`);
  }
  if (!Array.isArray(triage.observed_injuries)) {
    throw new Error("Mistral 'triage.observed_injuries' must be an array.");
  }
  return raw as unknown as MistralCore;
}

export async function mistralAnalyze(imageBase64: string): Promise<PassportResult> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY is not set.");

  const dataUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;

  const res = await fetch(MISTRAL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: [
          { type: "text", text: "Analyze this animal and return the JSON passport." },
          { type: "image_url", image_url: dataUrl },
        ] },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Mistral API error ${res.status}: ${body.slice(0, 300)}`);
  }

  const payload = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Mistral response had no message content.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`Mistral returned malformed JSON: ${content.slice(0, 300)}`);
  }

  const core = validateCore(parsed);

  return {
    species: core.species ?? null,
    breed: core.breed ?? null,
    breed_confidence: typeof core.breed_confidence === "number" ? core.breed_confidence : null,
    coat: {
      primary_color: core.coat.primary_color ?? null,
      secondary_color: core.coat.secondary_color ?? null,
      pattern: core.coat.pattern ?? null,
      distinctive_markings: core.coat.distinctive_markings ?? null,
    },
    triage: {
      severity: core.triage.severity as Severity,
      severity_score: core.triage.severity_score ?? 0,
      observed_injuries: core.triage.observed_injuries ?? [],
      urgent: Boolean(core.triage.urgent),
      triage_notes: core.triage.triage_notes ?? null,
    },
    biometric: { embedding: [], embedding_model: "clip-ViT-B-32", embedding_dim: EMBEDDING_DIM },
    photo_meta: { image_url: null, capture_timestamp: new Date().toISOString() },
    raw_llm_response: content,
  };
}
