// Shared enumerations (isolatedModules-safe: const arrays + union types).

export const ANIMAL_STATUSES = [
  "searching",
  "matched",
  "in_care",
  "ready_for_adoption",
  "adopted",
  "reunited",
  "deceased",
  "registered",
] as const;
export type AnimalStatus = (typeof ANIMAL_STATUSES)[number];

export const LIFECYCLE_STATUSES = [
  "searching",
  "matched",
  "in_care",
  "ready_for_adoption",
  "adopted",
  "reunited",
  "deceased",
] as const;

export const SPECIES_OPTIONS = ["dog", "cat", "rabbit", "bird", "other"] as const;
export type Species = (typeof SPECIES_OPTIONS)[number];
