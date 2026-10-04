import { DEFAULT_BEDTIME, HOUR } from '../../src/game/constants';
import { createEgg } from '../../src/game/pet';
import type { SimOptions } from '../../src/game/simulation';
import type { Pet } from '../../src/game/types';

/** 2026-01-05 09:00 UTC (a Monday morning, outside bedtime). */
export const MORNING = Date.UTC(2026, 0, 5, 9, 0);
/** 2026-01-05 22:00 UTC (bedtime starts). */
export const NIGHT = Date.UTC(2026, 0, 5, 22, 0);

export const OPTS: SimOptions = { bedtime: { ...DEFAULT_BEDTIME } };
/** Bedtime disabled — keeps a pet awake around the clock. */
export const NO_SLEEP: SimOptions = { bedtime: { start: 0, end: 0 } };

export function egg(now = MORNING, seed = 42): Pet {
  return createEgg({ id: 'p1', name: 'Mochi', species: 'cat', color: 0, now, seed });
}

/** A freshly hatched baby with full stats at `now`. */
export function baby(now = MORNING, seed = 42, overrides: Partial<Pet> = {}): Pet {
  const p = egg(now, seed);
  return {
    ...p,
    stage: 'baby',
    hatchedAt: now,
    stageStartedAt: now,
    stageDuration: 24 * HOUR,
    stats: { hunger: 100, happiness: 100, energy: 100, hygiene: 100, health: 100 },
    poopTimer: 3 * HOUR,
    ...overrides,
  };
}

export const round = (n: number) => Math.round(n * 100) / 100;
