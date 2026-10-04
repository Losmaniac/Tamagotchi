import { describe, expect, it } from 'vitest';
import {
  ACT_UP_DURATION,
  CALL_GRACE,
  DAY,
  EGG_WARM_MAX,
  HOUR,
  MINUTE,
  SURVIVAL_COINS_PER_DAY,
} from '../../src/game/constants';
import { careScore, formForScore, nextStage } from '../../src/game/evolution';
import { advance, chanceOver } from '../../src/game/simulation';
import { MORNING, NIGHT, NO_SLEEP, OPTS, baby, egg, round } from './helpers';

describe('egg', () => {
  it('hatches after 5 minutes', () => {
    const r1 = advance(egg(), MORNING + 4 * MINUTE, OPTS);
    expect(r1.pet.stage).toBe('egg');
    const r2 = advance(r1.pet, MORNING + 5 * MINUTE, OPTS);
    expect(r2.pet.stage).toBe('baby');
    expect(r2.pet.hatchedAt).toBe(MORNING + 5 * MINUTE);
    expect(r2.events.some((e) => e.type === 'hatched')).toBe(true);
  });

  it('hatches sooner when warmed', () => {
    const warm = { ...egg(), eggWarmth: EGG_WARM_MAX };
    const r = advance(warm, MORNING + 3 * MINUTE, OPTS);
    expect(r.pet.stage).toBe('baby');
    expect(r.pet.hatchedAt).toBe(MORNING + 150_000);
  });

  it('does not decay before hatching', () => {
    const r = advance(egg(), MORNING + 4 * MINUTE, OPTS);
    expect(r.pet.stats.hunger).toBe(100);
  });
});

describe('decay', () => {
  it('drains stats at awake rates', () => {
    const r = advance(baby(), MORNING + HOUR, NO_SLEEP);
    const s = r.pet.stats;
    expect(round(s.hunger)).toBe(94);
    expect(round(s.happiness)).toBe(95);
    expect(round(s.energy)).toBe(96);
    expect(round(s.hygiene)).toBe(97);
  });

  it('uses asleep rates and restores energy at night', () => {
    const p = baby(NIGHT, 42, {
      stats: { hunger: 90, happiness: 90, energy: 40, hygiene: 90, health: 100 },
      lightsOn: false,
    });
    const r = advance(p, NIGHT + HOUR, OPTS);
    expect(r.pet.asleep).toBe(true);
    expect(r.pet.sleepReason).toBe('bedtime');
    expect(round(r.pet.stats.hunger)).toBe(88);
    expect(round(r.pet.stats.energy)).toBe(52);
    expect(round(r.pet.stats.happiness)).toBe(89);
  });

  it('is independent of how time is sliced (no RNG involved)', () => {
    const p = baby();
    const once = advance(p, MORNING + HOUR, NO_SLEEP).pet;
    let stepped = p;
    for (let t = MORNING + 10_000; t <= MORNING + HOUR; t += 10_000)
      stepped = advance(stepped, t, NO_SLEEP).pet;
    expect(round(stepped.stats.hunger)).toBe(round(once.stats.hunger));
  });

  it('never mutates the input', () => {
    const p = baby();
    const copy = structuredClone(p);
    advance(p, MORNING + 5 * HOUR, OPTS);
    expect(p).toEqual(copy);
  });

  it('ignores time going backwards', () => {
    const p = baby();
    const r = advance(p, MORNING - HOUR, OPTS);
    expect(r.pet.stats).toEqual(p.stats);
    expect(r.events).toEqual([]);
  });
});

describe('poop', () => {
  it('drops after the awake timer and hits hygiene', () => {
    const p = baby(MORNING, 1, { poopTimer: 30 * MINUTE });
    const r = advance(p, MORNING + HOUR, NO_SLEEP);
    expect(r.pet.poops).toBe(1);
    expect(r.events.filter((e) => e.type === 'poop')).toHaveLength(1);
    expect(round(r.pet.stats.hygiene)).toBe(round(100 - 3 - 15));
  });

  it('drains happiness 2/h per uncleaned poop', () => {
    const p = baby(MORNING, 1, { poops: 2, poopTimer: 10 * HOUR });
    const r = advance(p, MORNING + HOUR, NO_SLEEP);
    expect(round(r.pet.stats.happiness)).toBe(100 - 5 - 4);
  });

  it('does not poop while asleep', () => {
    const p = baby(NIGHT, 1, { poopTimer: 1 * MINUTE, lightsOn: false });
    const r = advance(p, NIGHT + 2 * HOUR, OPTS);
    expect(r.pet.poops).toBe(0);
  });

  it('poops every 2–4 h over a long day', () => {
    const r = advance(baby(MORNING, 5), MORNING + 12 * HOUR, NO_SLEEP);
    const poops = r.events.filter((e) => e.type === 'poop').length;
    expect(poops).toBeGreaterThanOrEqual(3);
    expect(poops).toBeLessThanOrEqual(6);
  });
});

describe('sickness and health', () => {
  it('gets sick quickly with poor hygiene and hunger', () => {
    const p = baby(MORNING, 3, {
      stats: { hunger: 10, happiness: 80, energy: 80, hygiene: 10, health: 100 },
    });
    const r = advance(p, MORNING + 24 * HOUR, NO_SLEEP);
    expect(r.events.some((e) => e.type === 'sick')).toBe(true);
  });

  it('sick pets lose 4 health per hour', () => {
    const p = baby(MORNING, 3, { sick: true, medicineDosesLeft: 1 });
    const r = advance(p, MORNING + HOUR, NO_SLEEP);
    expect(round(r.pet.stats.health)).toBe(96);
  });

  it('low stats drain 2 health/h each', () => {
    const p = baby(MORNING, 3, {
      stats: { hunger: 10, happiness: 10, energy: 80, hygiene: 80, health: 80 },
    });
    // sickness RNG may add more drain; without it exactly −4/h.
    const r = advance({ ...p, sick: false }, MORNING + HOUR, NO_SLEEP);
    expect(r.pet.stats.health).toBeLessThanOrEqual(76.01);
  });

  it('regenerates health when everything is fine', () => {
    const p = baby(MORNING, 3, {
      stats: { hunger: 90, happiness: 90, energy: 90, hygiene: 90, health: 50 },
    });
    const r = advance(p, MORNING + HOUR, NO_SLEEP);
    expect(round(r.pet.stats.health)).toBe(51);
  });

  it('dies when health reaches 0 while sick', () => {
    const p = baby(MORNING, 3, {
      sick: true,
      medicineDosesLeft: 2,
      stats: { hunger: 90, happiness: 90, energy: 90, hygiene: 90, health: 3 },
    });
    const r = advance(p, MORNING + 2 * HOUR, NO_SLEEP);
    expect(r.pet.dead).toBe(true);
    expect(r.pet.deathCause).toBe('sickness');
  });
});

describe('sleep', () => {
  it('falls asleep at bedtime and wakes in the morning with lights on', () => {
    const p = baby(NIGHT - HOUR, 4, {
      stats: { hunger: 100, happiness: 100, energy: 60, hygiene: 100, health: 100 },
    });
    const night = advance(p, NIGHT + 30 * MINUTE, OPTS);
    expect(night.pet.asleep).toBe(true);
    const lightsOff = { ...night.pet, lightsOn: false };
    const morning = advance(lightsOff, NIGHT + 9 * HOUR + 10 * MINUTE, OPTS);
    expect(morning.pet.asleep).toBe(false);
    expect(morning.pet.lightsOn).toBe(true);
    expect(morning.events.some((e) => e.type === 'wokeUp')).toBe(true);
  });

  it('lights left on drain happiness and become a care mistake', () => {
    const p = baby(NIGHT, 4, { asleep: true, sleepReason: 'bedtime', lightsOn: true });
    const r = advance(p, NIGHT + HOUR, OPTS);
    expect(round(r.pet.stats.happiness)).toBe(100 - 1 - 3);
    expect(r.events.filter((e) => e.type === 'careMistake')).toHaveLength(1);
    expect(r.pet.totalCareMistakes).toBe(1);
  });

  it('naps when the lights go off and energy is low, then wakes rested', () => {
    const p = baby(MORNING, 4, {
      lightsOn: false,
      stats: { hunger: 100, happiness: 100, energy: 40, hygiene: 100, health: 100 },
    });
    const r = advance(p, MORNING + 10 * MINUTE, NO_SLEEP);
    expect(r.pet.sleepReason).toBe('nap');
    const later = advance(r.pet, MORNING + 6 * HOUR, NO_SLEEP);
    expect(later.pet.asleep).toBe(false);
  });

  it('a nap rolls into bedtime', () => {
    const p = baby(NIGHT - 10 * MINUTE, 4, {
      asleep: true,
      sleepReason: 'nap',
      lightsOn: false,
      stats: { hunger: 100, happiness: 100, energy: 10, hygiene: 100, health: 100 },
    });
    const r = advance(p, NIGHT + 10 * MINUTE, OPTS);
    expect(r.pet.sleepReason).toBe('bedtime');
  });

  it('passes out when exhausted', () => {
    const p = baby(MORNING, 4, {
      stats: { hunger: 100, happiness: 100, energy: 0, hygiene: 100, health: 100 },
    });
    const r = advance(p, MORNING + 5 * MINUTE, NO_SLEEP);
    expect(r.pet.sleepReason).toBe('exhausted');
  });

  it('stays up after being woken during bedtime', () => {
    const p = baby(NIGHT, 4, { stayAwakeUntil: NIGHT + HOUR });
    const r = advance(p, NIGHT + 30 * MINUTE, OPTS);
    expect(r.pet.asleep).toBe(false);
    const r2 = advance(r.pet, NIGHT + 70 * MINUTE, OPTS);
    expect(r2.pet.asleep).toBe(true);
  });
});

describe('calls and care mistakes', () => {
  it('a low stat answered within 15 min is not a mistake', () => {
    const p = baby(MORNING, 4, {
      stats: { hunger: 15, happiness: 100, energy: 100, hygiene: 100, health: 100 },
    });
    const r = advance(p, MORNING + 10 * MINUTE, NO_SLEEP);
    expect(r.pet.calls.hunger).toBeDefined();
    const fed = { ...r.pet, stats: { ...r.pet.stats, hunger: 60 } };
    const r2 = advance(fed, MORNING + 30 * MINUTE, NO_SLEEP);
    expect(r2.pet.calls.hunger).toBeUndefined();
    expect(r2.pet.totalCareMistakes).toBe(0);
  });

  it('an unanswered call counts once after the grace period', () => {
    const p = baby(MORNING, 4, {
      stats: { hunger: 15, happiness: 100, energy: 100, hygiene: 100, health: 100 },
    });
    const r = advance(p, MORNING + CALL_GRACE + 2 * HOUR, NO_SLEEP);
    expect(r.pet.totalCareMistakes).toBe(1);
    expect(r.pet.stageRecord.careMistakes).toBe(1);
  });
});

describe('discipline', () => {
  it('older pets act up and the tantrum expires if ignored', () => {
    const p = baby(MORNING, 11, { stage: 'child' });
    const r = advance(p, MORNING + 3 * DAY, NO_SLEEP);
    const acted = r.events.filter((e) => e.type === 'actedUp');
    expect(acted.length).toBeGreaterThan(0);
    const ignored = r.events.filter((e) => e.type === 'actIgnored').length;
    expect(ignored).toBeGreaterThan(0);
  });

  it('expires exactly after the act-up duration', () => {
    const p = baby(MORNING, 11, { stage: 'child', actingUp: { kind: 'fakeCall', since: MORNING } });
    const r = advance(p, MORNING + ACT_UP_DURATION, NO_SLEEP);
    expect(r.events.some((e) => e.type === 'actIgnored')).toBe(true);
    expect(r.pet.stageRecord.ignoredActs).toBeGreaterThanOrEqual(1);
  });

  it('babies never act up', () => {
    const r = advance(baby(MORNING, 11), MORNING + 20 * HOUR, NO_SLEEP);
    expect(r.events.some((e) => e.type === 'actedUp')).toBe(false);
  });
});

describe('life cycle', () => {
  it('evolves at the end of a stage', () => {
    const p = baby(MORNING, 2, { stageDuration: HOUR });
    const r = advance(p, MORNING + HOUR, NO_SLEEP);
    expect(r.pet.stage).toBe('child');
    expect(r.pet.stageStartedAt).toBe(MORNING + HOUR);
    expect(r.pet.stageRecord.samples).toBe(0);
    expect(r.events.find((e) => e.type === 'evolved')).toMatchObject({ stage: 'child' });
  });

  it('great care evolves into Star, poor care into Grumpy', () => {
    const great = baby(MORNING, 2, {
      stageDuration: 5 * MINUTE,
      stageRecord: { statSum: 95 * HOUR, samples: HOUR, careMistakes: 0, ignoredActs: 0 },
    });
    expect(advance(great, MORNING + 5 * MINUTE, NO_SLEEP).pet.form).toBe('star');
    const poor = baby(MORNING, 2, {
      stageDuration: 5 * MINUTE,
      stageRecord: { statSum: 60 * HOUR, samples: HOUR, careMistakes: 4, ignoredActs: 1 },
    });
    expect(advance(poor, MORNING + 5 * MINUTE, NO_SLEEP).pet.form).toBe('grumpy');
  });

  it('seniors die of old age', () => {
    const p = baby(MORNING, 2, { stage: 'senior', stageDuration: 2 * HOUR });
    const r = advance(p, MORNING + 3 * HOUR, NO_SLEEP);
    expect(r.pet.dead).toBe(true);
    expect(r.pet.deathCause).toBe('oldAge');
    expect(r.pet.diedAt).toBe(MORNING + 2 * HOUR);
  });

  it('pays survival coins per day and flags perfect days', () => {
    const p = baby(MORNING, 2, { stageDuration: 10 * DAY });
    // Keep the pet well fed so no care mistakes happen: re-fill stats each hour.
    let pet = p;
    let coins = 0;
    let perfect = 0;
    for (let h = 1; h <= 25; h++) {
      pet = {
        ...pet,
        poops: 0,
        stats: { hunger: 100, happiness: 100, energy: 100, hygiene: 100, health: 100 },
      };
      const r = advance(pet, MORNING + h * HOUR, NO_SLEEP);
      pet = r.pet;
      coins += r.coins;
      perfect += r.events.filter((e) => e.type === 'perfectDay').length;
    }
    expect(coins).toBe(SURVIVAL_COINS_PER_DAY);
    expect(perfect).toBe(1);
  });
});

describe('death from neglect', () => {
  it('dies when a stat sits at 0 for more than 12 h', () => {
    const p = baby(MORNING, 8, {
      stats: { hunger: 0, happiness: 100, energy: 100, hygiene: 100, health: 100 },
    });
    const r = advance(p, MORNING + 13 * HOUR, NO_SLEEP);
    expect(r.pet.dead).toBe(true);
    expect(r.pet.deathCause).toBe('neglect');
  });

  it('treats more than 14 days away as death from neglect', () => {
    const r = advance(baby(), MORNING + 15 * DAY, OPTS);
    expect(r.pet.dead).toBe(true);
    expect(r.pet.deathCause).toBe('neglect');
    expect(r.pet.lastTickAt).toBe(MORNING + 15 * DAY);
  });

  it('a neglected pet warns (critical health) before it dies', () => {
    let pet = baby(MORNING, 21);
    let sawCritical = false;
    for (let h = 1; h <= 96 && !pet.dead; h++) {
      pet = advance(pet, MORNING + h * HOUR, OPTS).pet;
      if (!pet.dead && pet.stats.health < 25) sawCritical = true;
    }
    expect(pet.dead).toBe(true);
    expect(sawCritical).toBe(true);
  });

  it('does nothing once dead', () => {
    const dead = { ...baby(), dead: true };
    const r = advance(dead, MORNING + DAY, OPTS);
    expect(r.events).toEqual([]);
  });
});

describe('determinism', () => {
  it('same save + timestamps → identical results', () => {
    const a = advance(baby(MORNING, 99), MORNING + 8 * HOUR, OPTS);
    const b = advance(baby(MORNING, 99), MORNING + 8 * HOUR, OPTS);
    expect(a).toEqual(b);
  });

  it('different seeds diverge over time', () => {
    const a = advance(baby(MORNING, 1), MORNING + 3 * DAY, OPTS);
    const b = advance(baby(MORNING, 2), MORNING + 3 * DAY, OPTS);
    expect(a.pet.rng).not.toBe(b.pet.rng);
  });
});

describe('evolution helpers', () => {
  it('scores care and maps to forms', () => {
    expect(careScore({ statSum: 0, samples: 0, careMistakes: 0, ignoredActs: 0 }, 0)).toBe(50);
    expect(careScore({ statSum: 80, samples: 1, careMistakes: 1, ignoredActs: 1 }, 50)).toBe(
      80 - 8 - 3 + 5,
    );
    expect(formForScore(75)).toBe('star');
    expect(formForScore(60)).toBe('normal');
    expect(formForScore(44)).toBe('grumpy');
    expect(nextStage('adult')).toBe('senior');
    expect(nextStage('senior')).toBeNull();
  });

  it('chanceOver scales with time', () => {
    expect(chanceOver(0, 1)).toBe(0);
    expect(chanceOver(1, 1)).toBe(1);
    expect(chanceOver(0.5, 2)).toBeCloseTo(0.75);
  });
});
