// Seeded mulberry32 RNG. The state is a uint32 stored on the pet so that
// offline catch-up produces the same result for the same save + timestamps.

export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max] (inclusive). */
  int(min: number, max: number): number;
  /** True with probability p. */
  chance(p: number): boolean;
  /** Current state; write it back to the save after use. */
  readonly state: number;
}

export function createRng(seed: number): Rng {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (p) => p > 0 && next() < p,
    get state() {
      return s;
    },
  };
}

/** Seed from a non-deterministic source; only used when creating a new egg. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 4294967296) >>> 0;
}
