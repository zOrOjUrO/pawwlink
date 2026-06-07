// Shared enumerations (isolatedModules-safe: const arrays + union types).

export const ANIMAL_STATUSES = [
  "searching",
  "matched",
  "in_care",
  "ready_for_adoption",
  "adopted",
  "reunited",
  "deceased",
  "registered", // owner reference pets — not part of the found-animal lifecycle
] as const;
export type AnimalStatus = (typeof ANIMAL_STATUSES)[number];

/** The seven lifecycle states a found animal can move through (excludes 'registered'). */
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
