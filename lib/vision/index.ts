// Vision entrypoint — toggles mock vs Mistral via MOCK_VISION.
import type { PassportResult } from "./types";
import { mockAnalyze } from "./mock";
import { mistralAnalyze } from "./mistral";

export { mockAnalyze } from "./mock";
export { mistralAnalyze } from "./mistral";
export type { PassportResult } from "./types";

export function isMockVision(): boolean {
  return (process.env.MOCK_VISION ?? "true").toLowerCase() !== "false";
}

export async function analyze(input: { imagePath: string; imageBase64: string }): Promise<PassportResult> {
  if (isMockVision()) return mockAnalyze(input.imagePath);
  return mistralAnalyze(input.imageBase64);
}
