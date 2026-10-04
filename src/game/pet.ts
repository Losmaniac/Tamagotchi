import { CARE_STATS, type ColorVariant, type Pet, type Species, type Stats } from './types';
import {
  POOP_MAX_INTERVAL,
  POOP_MIN_INTERVAL,
  STAGE_DURATION,
  STAT_MAX,
  STAT_MIN,
} from './constants';
import { createRng, type Rng } from './rng';

export const NAME_MAX_LENGTH = 12;

export interface NewEggOptions {
  id: string;
  name: string;
  species: Species;
  color: ColorVariant;
  now: number;
  seed: number;
}

export function sanitizeName(name: string): string {
  return Array.from(name.trim()).slice(0, NAME_MAX_LENGTH).join('');
}

export function createEgg({ id, name, species, color, now, seed }: NewEggOptions): Pet {
  return {
    id,
    name: sanitizeName(name),
    species,
    color,
    stage: 'egg',
    form: 'normal',
    bornAt: now,
    hatchedAt: null,
    stageStartedAt: now,
    stageDuration: STAGE_DURATION.egg,
    eggWarmth: 0,
    stats: { hunger: 100, happiness: 100, energy: 100, hygiene: 100, health: 100 },
    asleep: false,
    sleepReason: null,
    stayAwakeUntil: 0,
    lightsOn: true,
    sick: false,
    medicineDosesLeft: 0,
    poops: 0,
    poopTimer: POOP_MAX_INTERVAL,
    snackTimes: [],
    lastStrokeAt: 0,
    discipline: 0,
    actingUp: null,
    calls: {},
    zeroSince: {},
    stageRecord: { statSum: 0, samples: 0, careMistakes: 0, ignoredActs: 0 },
    totalCareMistakes: 0,
    survivalDaysPaid: 0,
    dayMistakes: 0,
    rng: seed >>> 0,
    lastTickAt: now,
    dead: false,
    deathCause: null,
    diedAt: null,
  };
}

export function clampStat(v: number): number {
  return Math.min(STAT_MAX, Math.max(STAT_MIN, v));
}

export function clampStats(stats: Stats): void {
  for (const k of Object.keys(stats) as (keyof Stats)[]) stats[k] = clampStat(stats[k]);
}

export function addStat(pet: Pet, key: keyof Stats, delta: number): void {
  pet.stats[key] = clampStat(pet.stats[key] + delta);
}

export function careAverage(stats: Stats): number {
  return CARE_STATS.reduce((sum, k) => sum + stats[k], 0) / CARE_STATS.length;
}

export function nextPoopInterval(rng: Rng): number {
  return POOP_MIN_INTERVAL + rng.next() * (POOP_MAX_INTERVAL - POOP_MIN_INTERVAL);
}

/** Deep copy so simulation/actions never mutate the caller's object. */
export function clonePet(pet: Pet): Pet {
  return structuredClone(pet);
}

/** Runs `fn` with an RNG seeded from the pet and writes the new RNG state back. */
export function withRng<T>(pet: Pet, fn: (rng: Rng) => T): T {
  const rng = createRng(pet.rng);
  const result = fn(rng);
  pet.rng = rng.state;
  return result;
}
