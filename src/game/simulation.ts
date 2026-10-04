// The heart of the game: advances a pet through real elapsed time.
// Pure and deterministic for a given (pet, from, to, options): randomness comes
// from the RNG state stored on the pet.

import {
  ACT_UP_CHANCE,
  ACT_UP_DURATION,
  CALL_GRACE,
  DAY,
  DECAY,
  HEALTH_REGEN,
  HEALTH_REGEN_MIN_STAT,
  HOUR,
  LIGHTS_ON_ASLEEP_HAPPINESS,
  LOW_STAT,
  LOW_STAT_HEALTH_DRAIN,
  MAX_CATCH_UP,
  MAX_POOPS,
  NAP_ENERGY_THRESHOLD,
  NAP_WAKE_ENERGY,
  POOP_HAPPINESS_DRAIN,
  POOP_HYGIENE_HIT,
  SICK_BASE_CHANCE,
  SICK_HEALTH_DRAIN,
  SICK_LOW_HUNGER,
  SICK_LOW_HUNGER_CHANCE,
  SICK_LOW_HYGIENE,
  SICK_LOW_HYGIENE_CHANCE,
  SIM_STEP,
  SURVIVAL_COINS_PER_DAY,
  ZERO_STAT_DEATH,
} from './constants';
import { killPet } from './death';
import { careScore, emptyStageRecord, formForScore, nextStage, stageDuration } from './evolution';
import { addStat, careAverage, clampStats, clonePet, nextPoopInterval } from './pet';
import { createRng, type Rng } from './rng';
import { isBedtime } from './sleep';
import { makeSick } from './sickness';
import {
  CARE_STATS,
  type Bedtime,
  type CallKind,
  type Pet,
  type SimEvent,
  type SleepReason,
} from './types';

export interface SimOptions {
  bedtime: Bedtime;
}

export interface AdvanceResult {
  pet: Pet;
  events: SimEvent[];
  /** Coins earned by surviving (paid into the wallet by the caller). */
  coins: number;
}

interface Ctx {
  rng: Rng;
  events: SimEvent[];
  opts: SimOptions;
}

/** Probability that an event with hourly rate `perHour` happens within `hours`. */
export function chanceOver(perHour: number, hours: number): number {
  if (perHour <= 0) return 0;
  return 1 - Math.pow(1 - Math.min(perHour, 1), hours);
}

export function fallAsleep(pet: Pet, t: number, reason: SleepReason, events: SimEvent[]): void {
  pet.asleep = true;
  pet.sleepReason = reason;
  pet.actingUp = null;
  events.push({ type: 'fellAsleep', t, reason });
}

export function wakeUp(pet: Pet, t: number, events: SimEvent[]): void {
  pet.asleep = false;
  pet.sleepReason = null;
  events.push({ type: 'wokeUp', t });
}

function hatch(pet: Pet, t: number, ctx: Ctx): void {
  pet.stage = 'baby';
  pet.hatchedAt = t;
  pet.stageStartedAt = t;
  pet.stageDuration = stageDuration('baby', ctx.rng);
  pet.stats = { hunger: 80, happiness: 80, energy: 90, hygiene: 100, health: 100 };
  pet.poopTimer = nextPoopInterval(ctx.rng);
  pet.stageRecord = emptyStageRecord();
  ctx.events.push({ type: 'hatched', t });
}

function updateSleep(pet: Pet, t: number, ctx: Ctx): void {
  const bedtime = isBedtime(t, ctx.opts.bedtime);
  if (pet.asleep) {
    if (pet.sleepReason === 'bedtime' && !bedtime) {
      wakeUp(pet, t, ctx.events);
      pet.lightsOn = true; // morning: lights come back on
    } else if (pet.sleepReason !== 'bedtime' && bedtime && t >= pet.stayAwakeUntil) {
      pet.sleepReason = 'bedtime'; // a nap rolls into the night
    } else if (pet.sleepReason !== 'bedtime' && pet.stats.energy >= NAP_WAKE_ENERGY) {
      wakeUp(pet, t, ctx.events);
    }
    return;
  }
  if (pet.stats.energy <= 0) fallAsleep(pet, t, 'exhausted', ctx.events);
  else if (bedtime && t >= pet.stayAwakeUntil) fallAsleep(pet, t, 'bedtime', ctx.events);
  else if (!pet.lightsOn && pet.stats.energy < NAP_ENERGY_THRESHOLD)
    fallAsleep(pet, t, 'nap', ctx.events);
}

function applyDecay(pet: Pet, hours: number): void {
  const s = pet.stats;
  const lowCount = CARE_STATS.filter((k) => s[k] < LOW_STAT).length;
  const allGood = CARE_STATS.every((k) => s[k] >= HEALTH_REGEN_MIN_STAT);
  const rates = pet.asleep ? DECAY.asleep : DECAY.awake;

  s.hunger -= rates.hunger * hours;
  s.energy -= rates.energy * hours;
  s.hygiene -= rates.hygiene * hours;
  let happinessDrain = rates.happiness + pet.poops * POOP_HAPPINESS_DRAIN;
  if (pet.asleep && pet.lightsOn) happinessDrain += LIGHTS_ON_ASLEEP_HAPPINESS;
  s.happiness -= happinessDrain * hours;

  let health = -lowCount * LOW_STAT_HEALTH_DRAIN;
  if (pet.sick) health -= SICK_HEALTH_DRAIN;
  else if (allGood) health += HEALTH_REGEN;
  s.health += health * hours;

  clampStats(s);
}

function updatePoop(pet: Pet, t: number, dt: number, ctx: Ctx): void {
  if (pet.asleep) return;
  pet.poopTimer -= dt;
  while (pet.poopTimer <= 0) {
    pet.poopTimer += nextPoopInterval(ctx.rng);
    if (pet.poops >= MAX_POOPS) continue;
    pet.poops += 1;
    addStat(pet, 'hygiene', -POOP_HYGIENE_HIT);
    ctx.events.push({ type: 'poop', t });
  }
}

function updateSickness(pet: Pet, t: number, hours: number, ctx: Ctx): void {
  if (pet.sick) return;
  let perHour = SICK_BASE_CHANCE;
  if (pet.stats.hygiene < SICK_LOW_HYGIENE) perHour += SICK_LOW_HYGIENE_CHANCE;
  if (pet.stats.hunger < SICK_LOW_HUNGER) perHour += SICK_LOW_HUNGER_CHANCE;
  if (ctx.rng.chance(chanceOver(perHour, hours))) makeSick(pet, t, ctx.rng, ctx.events);
}

function updateActingUp(pet: Pet, t: number, t1: number, hours: number, ctx: Ctx): void {
  if (pet.actingUp) {
    if (t1 - pet.actingUp.since >= ACT_UP_DURATION) {
      pet.actingUp = null;
      pet.stageRecord.ignoredActs += 1;
      ctx.events.push({ type: 'actIgnored', t: t1 });
    }
    return;
  }
  if (pet.asleep || pet.stage === 'baby') return;
  if (ctx.rng.chance(chanceOver(ACT_UP_CHANCE, hours))) {
    const kind = ctx.rng.chance(0.5) ? 'refuseFood' : 'fakeCall';
    pet.actingUp = { kind, since: t };
    ctx.events.push({ type: 'actedUp', t, kind });
  }
}

/** Which calls (needs) are currently active. */
export function activeCallKinds(pet: Pet): CallKind[] {
  if (pet.dead || pet.stage === 'egg') return [];
  const calls: CallKind[] = [];
  for (const k of CARE_STATS) {
    if (pet.stats[k] >= LOW_STAT) continue;
    if (k === 'energy' && pet.asleep) continue; // already resting
    calls.push(k);
  }
  if (pet.asleep && pet.lightsOn && pet.sleepReason === 'bedtime') calls.push('lights');
  return calls;
}

function recordCareMistake(pet: Pet, t: number, call: CallKind, events: SimEvent[]): void {
  pet.stageRecord.careMistakes += 1;
  pet.totalCareMistakes += 1;
  pet.dayMistakes += 1;
  events.push({ type: 'careMistake', t, call });
}

function updateCalls(pet: Pet, t1: number, ctx: Ctx): void {
  const active = new Set(activeCallKinds(pet));
  for (const kind of Object.keys(pet.calls) as CallKind[]) {
    if (!active.has(kind)) delete pet.calls[kind];
  }
  for (const kind of active) {
    const call = pet.calls[kind];
    if (!call) pet.calls[kind] = { since: t1, missed: false };
    else if (!call.missed && t1 - call.since >= CALL_GRACE) {
      call.missed = true;
      recordCareMistake(pet, t1, kind, ctx.events);
    }
  }
}

function updateZeroStats(pet: Pet, t1: number, ctx: Ctx): void {
  for (const k of CARE_STATS) {
    if (pet.stats[k] <= 0) {
      const since = (pet.zeroSince[k] ??= t1);
      if (t1 - since > ZERO_STAT_DEATH) {
        killPet(pet, t1, 'neglect');
        ctx.events.push({ type: 'died', t: t1, cause: 'neglect' });
        return;
      }
    } else {
      delete pet.zeroSince[k];
    }
  }
}

function updateDays(pet: Pet, t1: number, ctx: Ctx): void {
  if (pet.hatchedAt === null) return;
  const ageDays = Math.floor((t1 - pet.hatchedAt) / DAY);
  while (pet.survivalDaysPaid < ageDays) {
    pet.survivalDaysPaid += 1;
    ctx.events.push({ type: 'coins', t: t1, amount: SURVIVAL_COINS_PER_DAY });
    if (pet.dayMistakes === 0) ctx.events.push({ type: 'perfectDay', t: t1 });
    pet.dayMistakes = 0;
  }
}

function updateStage(pet: Pet, ctx: Ctx, t1: number): void {
  const end = pet.stageStartedAt + pet.stageDuration;
  if (t1 < end) return;
  const next = nextStage(pet.stage);
  if (!next) {
    killPet(pet, end, 'oldAge');
    ctx.events.push({ type: 'died', t: end, cause: 'oldAge' });
    return;
  }
  pet.form = formForScore(careScore(pet.stageRecord, pet.discipline));
  pet.stage = next;
  pet.stageStartedAt = end;
  pet.stageDuration = stageDuration(next, ctx.rng);
  pet.stageRecord = emptyStageRecord();
  ctx.events.push({ type: 'evolved', t: end, stage: next, form: pet.form });
}

/** Simulates one step [t, t + dt). Mutates `pet`. */
export function step(pet: Pet, t: number, dt: number, ctx: Ctx): void {
  if (pet.dead) return;
  const t1 = t + dt;

  if (pet.stage === 'egg') {
    const hatchAt = pet.stageStartedAt + pet.stageDuration - pet.eggWarmth;
    if (t1 < hatchAt) return;
    const at = Math.max(t, hatchAt);
    hatch(pet, at, ctx);
    dt = t1 - at;
    t = at;
    if (dt <= 0) return;
  }

  const hours = dt / HOUR;
  updateSleep(pet, t, ctx);
  applyDecay(pet, hours);
  updatePoop(pet, t, dt, ctx);
  updateSickness(pet, t, hours, ctx);
  updateActingUp(pet, t, t1, hours, ctx);
  updateCalls(pet, t1, ctx);

  pet.stageRecord.statSum += careAverage(pet.stats) * dt;
  pet.stageRecord.samples += dt;

  if (pet.stats.health <= 0) {
    const cause = pet.sick ? 'sickness' : 'neglect';
    killPet(pet, t1, cause);
    ctx.events.push({ type: 'died', t: t1, cause });
    return;
  }
  updateZeroStats(pet, t1, ctx);
  if (pet.dead) return;
  updateDays(pet, t1, ctx);
  updateStage(pet, ctx, t1);
}

/**
 * Advances the pet from its `lastTickAt` to `to` in SIM_STEP slices.
 * Gaps longer than MAX_CATCH_UP end in death from neglect.
 */
export function advance(input: Pet, to: number, opts: SimOptions): AdvanceResult {
  const pet = clonePet(input);
  const events: SimEvent[] = [];
  if (to <= pet.lastTickAt || pet.dead) {
    pet.lastTickAt = Math.max(pet.lastTickAt, to);
    return { pet, events, coins: 0 };
  }

  const rng = createRng(pet.rng);
  const ctx: Ctx = { rng, events, opts };
  const from = pet.lastTickAt;
  const end = Math.min(to, from + MAX_CATCH_UP);

  for (let t = from; t < end && !pet.dead;) {
    const dt = Math.min(SIM_STEP, end - t);
    step(pet, t, dt, ctx);
    t += dt;
  }

  if (!pet.dead && to - from > MAX_CATCH_UP) {
    killPet(pet, end, 'neglect');
    events.push({ type: 'died', t: end, cause: 'neglect' });
  }

  pet.rng = rng.state;
  pet.lastTickAt = to;
  const coins = events.reduce((sum, e) => (e.type === 'coins' ? sum + e.amount : sum), 0);
  return { pet, events, coins };
}
