// Vision contract — the output of the analyze step (mock or Pixtral).
export type Severity = "healthy" | "minor" | "moderate" | "critical";

export interface Coat {
  primary_color: string | null;
  secondary_color: string | null;
  pattern: string | null;
  distinctive_markings: string | null;
}

export interface Triage {
  severity: Severity;
  severity_score: number;
  observed_injuries: string[];
  urgent: boolean;
  triage_notes: string | null;
}

export interface Biometric {
  embedding: number[];
  embedding_model: string;
  embedding_dim: number;
}

export interface PhotoMeta {
  image_url: string | null;
  capture_timestamp: string | null;
}

export interface PassportResult {
  species: string | null;
  breed: string | null;
  breed_confidence: number | null;
  coat: Coat;
  triage: Triage;
  biometric: Biometric;
  photo_meta: PhotoMeta;
  raw_llm_response: string | null;
}
