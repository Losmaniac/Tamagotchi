// Player actions. Each takes a pet that has already been advanced to `now`
// and returns a new pet plus an outcome the UI can react to.

import {
  CLEAN_HYGIENE,
  EGG_WARM_MAX,
  EGG_WARM_PER_TAP,
  FULL_THRESHOLD,
  MEAL_HUNGER,
  MEDICINE_NOT_SICK_HAPPINESS,
  MINIGAME_ENERGY_COST,
  MIN_PLAY_ENERGY,
  NAP_ENERGY_THRESHOLD,
  OVERFEED_SICK_CHANCE,
  OVERFEED_SNACKS,
  OVERFEED_WINDOW,
  PLAY_ENERGY_COST,
  PLAY_HAPPINESS,
  PLAY_HUNGER_COST,
  SCOLD_DISCIPLINE,
  SNACK_HAPPINESS,
  SNACK_HISTORY_LIMIT,
  SNACK_HUNGER,
  STAY_AWAKE_AFTER_WAKE,
  STROKE_COOLDOWN,
  STROKE_HAPPINESS,
  UNFAIR_SCOLD_HAPPINESS,
  WAKE_HAPPINESS_PENALTY,
} from './constants';
import { addStat, clonePet, withRng } from './pet';
import { makeSick } from './sickness';
import { fallAsleep, wakeUp } from './simulation';
import type { Pet, SimEvent } from './types';

export type ActionOutcome =
  | 'ok'
  | 'dead'
  | 'egg'
  | 'asleep'
  | 'refused'
  | 'full'
  | 'gotSick'
  | 'cooldown'
  | 'notSick'
  | 'unfair'
  | 'awake'
  | 'tired'
  | 'cured';

export interface ActionResult {
  pet: Pet;
  outcome: ActionOutcome;
  events: SimEvent[];
}

type Guard = 'alive' | 'hatched' | 'awake';

function run(
  input: Pet,
  guards: Guard[],
  fn: (pet: Pet, events: SimEvent[]) => ActionOutcome,
): ActionResult {
  if (input.dead) return { pet: input, outcome: 'dead', events: [] };
  if (guards.includes('hatched') && input.stage === 'egg')
    return { pet: input, outcome: 'egg', events: [] };
  if (guards.includes('awake') && input.asleep)
    return { pet: input, outcome: 'asleep', events: [] };
  const pet = clonePet(input);
  const events: SimEvent[] = [];
  const outcome = fn(pet, events);
  return { pet, outcome, events };
}

export function feedMeal(input: Pet, _now: number): ActionResult {
  return run(input, ['hatched', 'awake'], (pet) => {
    if (pet.actingUp?.kind === 'refuseFood') return 'refused';
    if (pet.stats.hunger >= FULL_THRESHOLD) return 'full';
    addStat(pet, 'hunger', MEAL_HUNGER);
    return 'ok';
  });
}

export function feedSnack(input: Pet, now: number): ActionResult {
  return run(input, ['hatched', 'awake'], (pet, events) => {
    addStat(pet, 'hunger', SNACK_HUNGER);
    addStat(pet, 'happiness', SNACK_HAPPINESS);
    pet.snackTimes = [...pet.snackTimes.filter((t) => now - t < OVERFEED_WINDOW), now].slice(
      -SNACK_HISTORY_LIMIT,
    );
    if (pet.snackTimes.length > OVERFEED_SNACKS && !pet.sick) {
      const sick = withRng(pet, (rng) => {
        if (!rng.chance(OVERFEED_SICK_CHANCE)) return false;
        makeSick(pet, now, rng, events);
        return true;
      });
      if (sick) return 'gotSick';
    }
    return 'ok';
  });
}

/** Quick play with a toy (no mini-game). */
export function play(input: Pet, _now: number): ActionResult {
  return run(input, ['hatched', 'awake'], (pet) => {
    if (pet.stats.energy < MIN_PLAY_ENERGY) return 'tired';
    addStat(pet, 'happiness', PLAY_HAPPINESS);
    addStat(pet, 'energy', -PLAY_ENERGY_COST);
    addStat(pet, 'hunger', -PLAY_HUNGER_COST);
    return 'ok';
  });
}

/** Reward after a mini-game; `score` is normalised to 0–1. */
export function rewardMinigame(input: Pet, _now: number, score: number): ActionResult {
  return run(input, ['hatched', 'awake'], (pet) => {
    if (pet.stats.energy < MIN_PLAY_ENERGY) return 'tired';
    const s = Math.min(1, Math.max(0, score));
    addStat(pet, 'happiness', Math.round(10 + 15 * s));
    addStat(pet, 'energy', -MINIGAME_ENERGY_COST);
    addStat(pet, 'hunger', -PLAY_HUNGER_COST);
    return 'ok';
  });
}

/** Whether the pet can start a game right now (awake, hatched, enough energy). */
export function canPlay(pet: Pet): boolean {
  return !pet.dead && pet.stage !== 'egg' && !pet.asleep && pet.stats.energy >= MIN_PLAY_ENERGY;
}

export function coinsForMinigame(score: number): number {
  return Math.round(5 + 20 * Math.min(1, Math.max(0, score)));
}

export function stroke(input: Pet, now: number): ActionResult {
  return run(input, ['hatched', 'awake'], (pet) => {
    if (now - pet.lastStrokeAt < STROKE_COOLDOWN) return 'cooldown';
    pet.lastStrokeAt = now;
    addStat(pet, 'happiness', STROKE_HAPPINESS);
    return 'ok';
  });
}

export function clean(input: Pet, _now: number): ActionResult {
  return run(input, ['hatched'], (pet) => {
    pet.poops = 0;
    addStat(pet, 'hygiene', CLEAN_HYGIENE);
    return 'ok';
  });
}

export function toggleLights(input: Pet, now: number): ActionResult {
  return run(input, ['hatched'], (pet, events) => {
    pet.lightsOn = !pet.lightsOn;
    if (!pet.lightsOn) {
      delete pet.calls.lights;
      if (!pet.asleep && pet.stats.energy < NAP_ENERGY_THRESHOLD)
        fallAsleep(pet, now, 'nap', events);
    }
    return 'ok';
  });
}

export function giveMedicine(input: Pet, now: number): ActionResult {
  return run(input, ['hatched'], (pet, events) => {
    if (!pet.sick) {
      addStat(pet, 'happiness', MEDICINE_NOT_SICK_HAPPINESS);
      return 'notSick';
    }
    pet.medicineDosesLeft = Math.max(0, pet.medicineDosesLeft - 1);
    if (pet.medicineDosesLeft > 0) return 'ok';
    pet.sick = false;
    events.push({ type: 'cured', t: now });
    return 'cured';
  });
}

export function scold(input: Pet, _now: number): ActionResult {
  return run(input, ['hatched', 'awake'], (pet) => {
    if (!pet.actingUp) {
      addStat(pet, 'happiness', UNFAIR_SCOLD_HAPPINESS);
      return 'unfair';
    }
    pet.actingUp = null;
    pet.discipline = Math.min(100, pet.discipline + SCOLD_DISCIPLINE);
    return 'ok';
  });
}

export function wake(input: Pet, now: number): ActionResult {
  return run(input, ['hatched'], (pet, events) => {
    if (!pet.asleep) return 'awake';
    wakeUp(pet, now, events);
    pet.lightsOn = true;
    pet.stayAwakeUntil = now + STAY_AWAKE_AFTER_WAKE;
    addStat(pet, 'happiness', -WAKE_HAPPINESS_PENALTY);
    return 'ok';
  });
}

export function warmEgg(input: Pet, _now: number): ActionResult {
  return run(input, [], (pet) => {
    if (pet.stage !== 'egg') return 'refused';
    pet.eggWarmth = Math.min(EGG_WARM_MAX, pet.eggWarmth + EGG_WARM_PER_TAP);
    return 'ok';
  });
}
