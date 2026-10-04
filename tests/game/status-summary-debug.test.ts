import { describe, expect, it } from 'vitest';
import { debugForceSick, debugKill, debugSetStat, debugSkipStage } from '../../src/game/debug';
import { petAge, toMemorial } from '../../src/game/death';
import { HOUR, MINUTE } from '../../src/game/constants';
import { advance } from '../../src/game/simulation';
import {
  isCritical,
  lowestCareStat,
  moodOf,
  needs,
  stageProgress,
  timeToNextStage,
} from '../../src/game/status';
import { isSummaryWorthShowing, summarize } from '../../src/game/summary';
import { MORNING, NO_SLEEP, OPTS, baby, egg } from './helpers';

const stats = (
  o: Partial<Record<'hunger' | 'happiness' | 'energy' | 'hygiene' | 'health', number>>,
) => ({
  hunger: 80,
  happiness: 80,
  energy: 80,
  hygiene: 80,
  health: 100,
  ...o,
});

describe('moodOf', () => {
  it('reflects the most important state', () => {
    expect(moodOf(egg())).toBe('egg');
    expect(moodOf(baby(MORNING, 1, { dead: true }))).toBe('dead');
    expect(moodOf(baby(MORNING, 1, { asleep: true }))).toBe('sleeping');
    expect(moodOf(baby(MORNING, 1, { sick: true }))).toBe('sick');
    expect(moodOf(baby(MORNING, 1, { stats: stats({ health: 10 }) }))).toBe('critical');
    expect(moodOf(baby(MORNING, 1, { actingUp: { kind: 'fakeCall', since: 0 } }))).toBe('grumpy');
    expect(moodOf(baby(MORNING, 1, { stats: stats({ happiness: 20 }) }))).toBe('sad');
    expect(moodOf(baby(MORNING, 1, { poops: 1 }))).toBe('dirty');
    expect(moodOf(baby())).toBe('happy');
    expect(moodOf(baby(MORNING, 1, { stats: stats({ happiness: 50 }) }))).toBe('content');
  });

  it('flags critical health only for living hatched pets', () => {
    expect(isCritical(baby(MORNING, 1, { stats: stats({ health: 20 }) }))).toBe(true);
    expect(isCritical(baby(MORNING, 1, { dead: true, stats: stats({ health: 0 }) }))).toBe(false);
    expect(isCritical(egg())).toBe(false);
  });
});

describe('needs and progress', () => {
  it('lists active calls', () => {
    const p = baby(MORNING, 1, { stats: stats({ hunger: 10, energy: 5 }) });
    expect(needs(p)).toEqual(['hunger', 'energy']);
    expect(needs({ ...p, asleep: true })).toEqual(['hunger']);
    expect(needs(egg())).toEqual([]);
    expect(lowestCareStat(p)).toBe('energy');
  });

  it('reports stage progress', () => {
    const e = egg();
    expect(stageProgress(e, MORNING)).toBe(0);
    expect(stageProgress(e, MORNING + 150_000)).toBeCloseTo(0.5);
    expect(timeToNextStage({ ...e, eggWarmth: 60_000 }, MORNING)).toBe(4 * MINUTE);
    expect(stageProgress(baby(), MORNING + 48 * HOUR)).toBe(1);
  });
});

describe('summarize', () => {
  it('collects what happened while away', () => {
    const before = baby(MORNING, 7, { poopTimer: 30 * MINUTE });
    const r = advance(before, MORNING + 8 * HOUR, NO_SLEEP);
    const s = summarize(before, r.pet, r.events, MORNING, MORNING + 8 * HOUR, r.coins);
    expect(s.poops).toBeGreaterThanOrEqual(2);
    expect(s.statDelta.hunger).toBe(-48);
    expect(s.died).toBeNull();
    expect(isSummaryWorthShowing(s)).toBe(true);
  });

  it('is deterministic for an 8-hour absence', () => {
    const run = () => {
      const before = baby(MORNING, 1234);
      const r = advance(before, MORNING + 8 * HOUR, OPTS);
      return summarize(before, r.pet, r.events, MORNING, MORNING + 8 * HOUR, r.coins);
    };
    expect(run()).toEqual(run());
  });

  it('skips tiny absences unless something big happened', () => {
    const p = baby();
    const s = summarize(p, p, [], MORNING, MORNING + MINUTE, 0);
    expect(isSummaryWorthShowing(s)).toBe(false);
    expect(isSummaryWorthShowing({ ...s, hatched: true })).toBe(true);
    const evolvedEvents = [
      { type: 'evolved' as const, t: 1, stage: 'child' as const, form: 'star' as const },
      { type: 'died' as const, t: 2, cause: 'oldAge' as const },
    ];
    const s2 = summarize(p, p, evolvedEvents, MORNING, MORNING + MINUTE, 0);
    expect(s2.evolved).toEqual([{ stage: 'child', form: 'star' }]);
    expect(s2.died).toBe('oldAge');
  });
});

describe('debug helpers and memorial', () => {
  it('set stats, force sickness, skip stages and kill', () => {
    const p = baby();
    expect(debugSetStat(p, 'hunger', 150).stats.hunger).toBe(100);
    expect(debugForceSick(p, MORNING).sick).toBe(true);
    const skipped = debugSkipStage(p, MORNING + HOUR);
    expect(advance(skipped, MORNING + HOUR + 1000, NO_SLEEP).pet.stage).toBe('child');
    const skippedEgg = debugSkipStage(egg(), MORNING);
    expect(advance(skippedEgg, MORNING + 1000, NO_SLEEP).pet.stage).toBe('baby');
    const dead = debugKill(p, MORNING + HOUR);
    expect(dead.dead).toBe(true);
    expect(debugKill(dead, MORNING + 2 * HOUR).diedAt).toBe(MORNING + HOUR);
    expect(debugSkipStage(dead, MORNING).stageStartedAt).toBe(dead.stageStartedAt);
  });

  it('builds memorial entries only for dead pets', () => {
    const p = baby();
    expect(toMemorial(p)).toBeNull();
    const dead = debugKill(p, MORNING + 2 * HOUR);
    expect(toMemorial(dead)).toMatchObject({ name: 'Mochi', cause: 'sickness', age: 2 * HOUR });
    expect(petAge(egg(), MORNING + HOUR)).toBe(0);
  });
});
