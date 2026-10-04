import { describe, expect, it } from 'vitest';
import {
  clean,
  coinsForMinigame,
  feedMeal,
  feedSnack,
  giveMedicine,
  play,
  rewardMinigame,
  scold,
  stroke,
  toggleLights,
  wake,
  warmEgg,
} from '../../src/game/actions';
import { EGG_WARM_MAX, HOUR, STROKE_COOLDOWN } from '../../src/game/constants';
import { MORNING, NIGHT, baby, egg } from './helpers';

const half = { hunger: 50, happiness: 50, energy: 50, hygiene: 50, health: 100 };

describe('feeding', () => {
  it('meals add 30 fullness', () => {
    const r = feedMeal(baby(MORNING, 1, { stats: { ...half } }), MORNING);
    expect(r.outcome).toBe('ok');
    expect(r.pet.stats.hunger).toBe(80);
  });

  it('meals are refused when full, asleep, acting up, dead or an egg', () => {
    expect(feedMeal(baby(), MORNING).outcome).toBe('full');
    expect(feedMeal(baby(MORNING, 1, { asleep: true }), MORNING).outcome).toBe('asleep');
    expect(
      feedMeal(
        baby(MORNING, 1, { stats: { ...half }, actingUp: { kind: 'refuseFood', since: MORNING } }),
        MORNING,
      ).outcome,
    ).toBe('refused');
    expect(feedMeal(baby(MORNING, 1, { dead: true }), MORNING).outcome).toBe('dead');
    expect(feedMeal(egg(), MORNING).outcome).toBe('egg');
  });

  it('snacks add fullness and happiness', () => {
    const r = feedSnack(baby(MORNING, 1, { stats: { ...half } }), MORNING);
    expect(r.pet.stats.hunger).toBe(60);
    expect(r.pet.stats.happiness).toBe(58);
    expect(r.pet.snackTimes).toEqual([MORNING]);
  });

  it('more than 4 snacks in 2 h can make the pet sick', () => {
    let sickCount = 0;
    for (let seed = 1; seed <= 40; seed++) {
      let pet = baby(MORNING, seed, { stats: { ...half } });
      let outcome = '';
      for (let i = 0; i < 5; i++) {
        const r = feedSnack(pet, MORNING + i * 60_000);
        pet = r.pet;
        outcome = r.outcome;
      }
      if (outcome === 'gotSick') {
        sickCount++;
        expect(pet.sick).toBe(true);
        expect(pet.medicineDosesLeft).toBeGreaterThanOrEqual(1);
      }
    }
    expect(sickCount).toBeGreaterThan(5);
    expect(sickCount).toBeLessThan(35);
  });

  it('snacks spread over time never cause sickness', () => {
    let pet = baby(MORNING, 1, { stats: { ...half } });
    for (let i = 0; i < 10; i++) {
      const r = feedSnack(pet, MORNING + i * HOUR);
      expect(r.outcome).toBe('ok');
      pet = r.pet;
    }
  });
});

describe('play and petting', () => {
  it('play raises happiness and costs energy', () => {
    const r = play(baby(MORNING, 1, { stats: { ...half } }), MORNING);
    expect(r.pet.stats.happiness).toBe(65);
    expect(r.pet.stats.energy).toBe(42);
  });

  it('mini-game rewards scale with score', () => {
    const low = rewardMinigame(baby(MORNING, 1, { stats: { ...half } }), MORNING, 0);
    const high = rewardMinigame(baby(MORNING, 1, { stats: { ...half } }), MORNING, 2);
    expect(low.pet.stats.happiness).toBe(60);
    expect(high.pet.stats.happiness).toBe(75);
    expect(coinsForMinigame(0)).toBe(5);
    expect(coinsForMinigame(1)).toBe(25);
    expect(coinsForMinigame(-1)).toBe(5);
  });

  it('strokes are rate-limited', () => {
    const r1 = stroke(baby(MORNING, 1, { stats: { ...half } }), MORNING);
    expect(r1.pet.stats.happiness).toBe(52);
    expect(stroke(r1.pet, MORNING + 1000).outcome).toBe('cooldown');
    expect(stroke(r1.pet, MORNING + STROKE_COOLDOWN).outcome).toBe('ok');
  });
});

describe('care', () => {
  it('cleaning removes poops and boosts hygiene', () => {
    const r = clean(baby(MORNING, 1, { poops: 3, stats: { ...half } }), MORNING);
    expect(r.pet.poops).toBe(0);
    expect(r.pet.stats.hygiene).toBe(90);
  });

  it('lights toggle; turning them off answers the lights call and starts a nap if tired', () => {
    const asleep = baby(NIGHT, 1, {
      asleep: true,
      sleepReason: 'bedtime',
      calls: { lights: { since: NIGHT, missed: false } },
    });
    const off = toggleLights(asleep, NIGHT);
    expect(off.pet.lightsOn).toBe(false);
    expect(off.pet.calls.lights).toBeUndefined();
    expect(toggleLights(off.pet, NIGHT).pet.lightsOn).toBe(true);

    const tired = toggleLights(baby(MORNING, 1, { stats: { ...half, energy: 30 } }), MORNING);
    expect(tired.pet.asleep).toBe(true);
    expect(tired.pet.sleepReason).toBe('nap');
  });

  it('medicine cures after the required doses', () => {
    const sick = baby(MORNING, 1, { sick: true, medicineDosesLeft: 2 });
    const d1 = giveMedicine(sick, MORNING);
    expect(d1.outcome).toBe('ok');
    expect(d1.pet.sick).toBe(true);
    const d2 = giveMedicine(d1.pet, MORNING);
    expect(d2.outcome).toBe('cured');
    expect(d2.pet.sick).toBe(false);
    expect(d2.events[0]?.type).toBe('cured');
  });

  it('medicine for a healthy pet is a yucky no-op', () => {
    const r = giveMedicine(baby(), MORNING);
    expect(r.outcome).toBe('notSick');
    expect(r.pet.stats.happiness).toBe(95);
  });
});

describe('discipline and sleep actions', () => {
  it('scolding a tantrum raises discipline; scolding for nothing is unfair', () => {
    const acting = baby(MORNING, 1, {
      stage: 'child',
      actingUp: { kind: 'fakeCall', since: MORNING },
    });
    const r = scold(acting, MORNING);
    expect(r.outcome).toBe('ok');
    expect(r.pet.discipline).toBe(25);
    expect(r.pet.actingUp).toBeNull();
    const unfair = scold(baby(), MORNING);
    expect(unfair.outcome).toBe('unfair');
    expect(unfair.pet.stats.happiness).toBe(90);
  });

  it('waking a sleeping pet costs happiness and keeps it up for an hour', () => {
    const r = wake(
      baby(NIGHT, 1, { asleep: true, sleepReason: 'bedtime', lightsOn: false }),
      NIGHT,
    );
    expect(r.outcome).toBe('ok');
    expect(r.pet.asleep).toBe(false);
    expect(r.pet.lightsOn).toBe(true);
    expect(r.pet.stats.happiness).toBe(90);
    expect(r.pet.stayAwakeUntil).toBe(NIGHT + HOUR);
    expect(wake(baby(), MORNING).outcome).toBe('awake');
  });

  it('warming the egg is capped', () => {
    let pet = egg();
    for (let i = 0; i < 100; i++) pet = warmEgg(pet, MORNING).pet;
    expect(pet.eggWarmth).toBe(EGG_WARM_MAX);
    expect(warmEgg(baby(), MORNING).outcome).toBe('refused');
  });
});
