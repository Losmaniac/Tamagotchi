// Helpers for the hidden ?debug=1 panel. Pure: each returns a new pet.

import { killPet } from './death';
import { clampStat, clonePet, withRng } from './pet';
import { makeSick } from './sickness';
import type { Pet, StatKey } from './types';

export function debugSetStat(input: Pet, key: StatKey, value: number): Pet {
  const pet = clonePet(input);
  pet.stats[key] = clampStat(value);
  return pet;
}

export function debugForceSick(input: Pet, now: number): Pet {
  const pet = clonePet(input);
  withRng(pet, (rng) => makeSick(pet, now, rng, []));
  return pet;
}

/** Moves the stage start back so the next tick finishes the stage. */
export function debugSkipStage(input: Pet, now: number): Pet {
  const pet = clonePet(input);
  if (pet.dead) return pet;
  const warmth = pet.stage === 'egg' ? pet.eggWarmth : 0;
  pet.stageStartedAt = now - pet.stageDuration + warmth;
  return pet;
}

export function debugKill(input: Pet, now: number): Pet {
  const pet = clonePet(input);
  if (!pet.dead) killPet(pet, now, 'sickness');
  return pet;
}
