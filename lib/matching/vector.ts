// Image embedding for pgvector similarity.
export const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM ?? 512);
export const HIGH_CONFIDENCE = 0.85;
export const MATCH_THRESHOLD = 0.75;

const USE_CLIP = (process.env.USE_CLIP ?? "false").toLowerCase() === "true";

import { hashEmbedding } from "@/lib/embedding";
export { hashEmbedding };

type FeatureExtractor = (
  image: unknown,
  opts: { pooling: "mean"; normalize: boolean }
) => Promise<{ data: Float32Array }>;

let _extractor: Promise<FeatureExtractor> | null = null;
async function getExtractor(): Promise<FeatureExtractor> {
  if (!_extractor) {
    const { pipeline } = await import("@xenova/transformers");
    _extractor = pipeline("image-feature-extraction", "Xenova/clip-vit-base-patch32") as unknown as Promise<FeatureExtractor>;
  }
  return _extractor;
}

export async function embedImage(bytes: Uint8Array): Promise<number[]> {
  if (USE_CLIP) {
    try {
      const { RawImage } = await import("@xenova/transformers");
      const image = await RawImage.fromBlob(new Blob([bytes as BlobPart]));
      const extractor = await getExtractor();
      const output = await extractor(image, { pooling: "mean", normalize: true });
      const vec = Array.from(output.data as Float32Array, (x) => Number(x));
      if (vec.length === EMBEDDING_DIM) return vec;
      console.warn(`CLIP returned ${vec.length} dims (expected ${EMBEDDING_DIM}); using fallback.`);
    } catch (err) {
      console.warn(`CLIP embedding unavailable (${err instanceof Error ? err.message : err}); using deterministic fallback.`);
    }
  }
  return hashEmbedding(bytes);
}
