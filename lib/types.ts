// Shared PawLink types. Passport shape lives in lib/vision/types.ts.
export type {
  Severity,
  Coat,
  Triage,
  Biometric,
  PhotoMeta,
  PassportResult,
} from "@/lib/vision/types";

import type { PassportResult, Severity } from "@/lib/vision/types";

export type Passport = PassportResult;

export interface PassportSummary {
  species: string | null;
  breed: string | null;
  breed_confidence: number | null;
  primary_color: string | null;
  severity: Severity;
  severity_score: number;
  urgent: boolean;
  triage_notes: string | null;
}

export interface IntakeResponse {
  animal_id: string;
  status: string;
  image_url: string | null;
  chip_number: string | null;
  summary: PassportSummary;
}

export interface VisualMatch {
  owner_id: string;
  confidence: number;
}

export type CombinedStatus = "matched" | "searching" | "no_match";

export interface MatchResponse {
  animal_id: string;
  chip_match: boolean;
  visual_match: VisualMatch | null;
  combined_status: CombinedStatus;
  high_confidence_match: boolean;
  matched_source: string | null;
  sources_queried: string[];
}

export interface NotifyResponse {
  notification_sent: boolean;
  channel: "owner_sms" | "community_alert";
  provider: string;
  recipient: string | null;
  message_preview: string | null;
}
