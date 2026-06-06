// Simulated federated chip lookup across Dutch/EU pet registries.
// The three registries are queried IN PARALLEL — see runFederatedQuery (Promise.all).

export type RegistrySource = "amivedi" | "ndg" | "petbase";

export interface RegistryOwner {
  name: string;
  phone: string;
  email: string;
}

export interface RegistryHit {
  source: RegistrySource;
  owner: RegistryOwner;
  confidence: number; // 1.0 for an exact chip match
}

/** Demo chip number that always resolves via Amivedi. */
export const DEMO_CHIP = "528140000123456";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Dutch Amivedi registry. Returns a hit for the demo chip, otherwise null. */
export async function mockAmivedi(chipNumber: string): Promise<RegistryHit | null> {
  await sleep(120); // simulate registry network latency
  if (chipNumber === DEMO_CHIP) {
    return {
      source: "amivedi",
      owner: {
        name: "Sophie van der Berg",
        phone: "+31612345678",
        email: "sophie.vdberg@example.nl",
      },
      confidence: 1.0,
    };
  }
  return null;
}

/** NDG — Nederlandse Databank Gezelschapsdieren. No hits in the demo. */
export async function mockNDG(_chipNumber: string): Promise<RegistryHit | null> {
  await sleep(140);
  return null;
}

/** PetBase EU. No hits in the demo. */
export async function mockPetBase(_chipNumber: string): Promise<RegistryHit | null> {
  await sleep(100);
  return null;
}

/**
 * Query all three registries CONCURRENTLY and return the first hit by priority
 * (Amivedi → NDG → PetBase). Total latency ≈ the slowest call, not the sum.
 */
export async function runFederatedQuery(chipNumber: string | null): Promise<RegistryHit | null> {
  if (!chipNumber) return null;
  const [amivedi, ndg, petbase] = await Promise.all([
    mockAmivedi(chipNumber),
    mockNDG(chipNumber),
    mockPetBase(chipNumber),
  ]);
  return amivedi ?? ndg ?? petbase ?? null;
}
