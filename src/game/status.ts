import { CRITICAL_HEALTH, LOW_STAT } from './constants';
import { activeCallKinds } from './simulation';
import { CARE_STATS, type CallKind, type Pet } from './types';

export type Mood =
  | 'dead'
  | 'egg'
  | 'sleeping'
  | 'sick'
  | 'critical'
  | 'sad'
  | 'grumpy'
  | 'dirty'
  | 'happy'
  | 'content';

export function isCritical(pet: Pet): boolean {
  return !pet.dead && pet.stage !== 'egg' && pet.stats.health < CRITICAL_HEALTH;
}

/** The dominant visible mood; drives facial expression and animation. */
export function moodOf(pet: Pet): Mood {
  if (pet.dead) return 'dead';
  if (pet.stage === 'egg') return 'egg';
  if (pet.asleep) return 'sleeping';
  if (pet.sick) return 'sick';
  if (isCritical(pet)) return 'critical';
  if (pet.actingUp) return 'grumpy';
  const s = pet.stats;
  if (s.happiness < 30 || s.hunger < LOW_STAT || s.energy < LOW_STAT) return 'sad';
  if (pet.poops > 0 || s.hygiene < 30) return 'dirty';
  if (s.happiness >= 70) return 'happy';
  return 'content';
}

export function needs(pet: Pet): CallKind[] {
  return activeCallKinds(pet);
}

export function lowestCareStat(pet: Pet) {
  return CARE_STATS.reduce((a, b) => (pet.stats[b] < pet.stats[a] ? b : a));
}

/** Progress (0–1) through the current life stage. */
export function stageProgress(pet: Pet, now: number): number {
  const warmth = pet.stage === 'egg' ? pet.eggWarmth : 0;
  const elapsed = now - pet.stageStartedAt + warmth;
  return Math.min(1, Math.max(0, elapsed / pet.stageDuration));
}

export function timeToNextStage(pet: Pet, now: number): number {
  const warmth = pet.stage === 'egg' ? pet.eggWarmth : 0;
  return Math.max(0, pet.stageStartedAt + pet.stageDuration - warmth - now);
}
