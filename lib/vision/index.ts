// Vision entrypoint — toggles mock vs Pixtral via MOCK_VISION.
import type { PassportResult } from "./types";
import { mockAnalyze } from "./mock";
import { pixtralAnalyze } from "./pixtral";

export { mockAnalyze } from "./mock";
export { pixtralAnalyze } from "./pixtral";
export type { PassportResult } from "./types";

export function isMockVision(): boolean {
  return (process.env.MOCK_VISION ?? "true").toLowerCase() !== "false";
}

export async function analyze(input: {
  imagePath: string;
  imageBase64: string;
}): Promise<PassportResult> {
  if (isMockVision()) return mockAnalyze(input.imagePath);
  return pixtralAnalyze(input.imageBase64);
}
