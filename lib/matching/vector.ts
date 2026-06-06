// Image embedding for pgvector similarity.
//
// By default we use a fast, dependency-free deterministic embedding (no native
// modules), which keeps `next dev` working everywhere. Real CLIP via
// @xenova/transformers is opt-in (USE_CLIP=true) and requires `sharp`; if it is
// enabled but unavailable, we transparently fall back instead of crashing.

export const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM ?? 512);
export const HIGH_CONFIDENCE = 0.85;
export const MATCH_THRESHOLD = 0.75;

const USE_CLIP = (process.env.USE_CLIP ?? "false").toLowerCase() === "true";

/**
 * Deterministic 512-dim, L2-normalized embedding derived from the raw image
 * bytes (FNV-1a hash → mulberry32 PRNG). Same bytes → same vector. Not a
 * semantic embedding, but stable and dependency-free — good enough for the demo
 * and for keeping pgvector inserts valid.
 */
export function hashEmbedding(bytes: Uint8Array, dim = EMBEDDING_DIM): number[] {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  const rand = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const v = Array.from({ length: dim }, () => rand() * 2 - 1);
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => Number((x / norm).toFixed(6)));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _extractor: Promise<any> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getExtractor(): Promise<any> {
  if (!_extractor) {
    const { pipeline } = await import("@xenova/transformers");
    _extractor = pipeline("image-feature-extraction", "Xenova/clip-vit-base-patch32");
  }
  return _extractor;
}

/**
 * Returns a 512-dim embedding for the image. Uses CLIP ViT-B-32 when USE_CLIP
 * is enabled and available, otherwise the deterministic hash fallback. Never
 * throws — embedding failures degrade gracefully so intake always succeeds.
 */
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
      console.warn(
        `CLIP embedding unavailable (${err instanceof Error ? err.message : err}); using deterministic fallback.`
      );
    }
  }
  return hashEmbedding(bytes);
}
