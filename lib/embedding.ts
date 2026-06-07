// Deterministic embedding helpers (no native deps). Single source of truth —
// previously duplicated in lib/db/supabase.ts and lib/vision/mock.ts.

const DEFAULT_DIM = Number(process.env.EMBEDDING_DIM ?? 512);

function mulberry32(seedInt: number, dim: number): number[] {
  let a = seedInt >>> 0;
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

/** Deterministic 512-d, L2-normalized vector from a string seed (xmur3 → mulberry32). */
export function seededEmbedding(seed: string, dim = DEFAULT_DIM): number[] {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return mulberry32(h, dim);
}

/** Deterministic 512-d, L2-normalized vector from raw image bytes (FNV-1a → mulberry32). */
export function hashEmbedding(bytes: Uint8Array, dim = DEFAULT_DIM): number[] {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 16777619);
  }
  return mulberry32(h, dim);
}
