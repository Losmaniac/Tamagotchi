import { describe, expect, it } from 'vitest';
import { createRng, randomSeed } from '../../src/game/rng';
import { formatClock, isBedtime, localMinutes, parseClock } from '../../src/game/sleep';
import { addStat, careAverage, clampStat, createEgg, sanitizeName } from '../../src/game/pet';
import { MORNING, baby } from './helpers';

describe('rng', () => {
  it('is deterministic for a seed', () => {
    const a = createRng(123);
    const b = createRng(123);
    const seqA = [a.next(), a.next(), a.next()];
    expect([b.next(), b.next(), b.next()]).toEqual(seqA);
    expect(a.state).toBe(b.state);
  });

  it('produces values in range', () => {
    const r = createRng(7);
    for (let i = 0; i < 500; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      const n = r.int(1, 2);
      expect([1, 2]).toContain(n);
    }
  });

  it('chance respects 0 and 1', () => {
    const r = createRng(1);
    expect(r.chance(0)).toBe(false);
    expect(r.chance(1)).toBe(true);
  });

  it('randomSeed returns a uint32', () => {
    const s = randomSeed();
    expect(Number.isInteger(s)).toBe(true);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThan(2 ** 32);
  });
});

describe('sleep schedule', () => {
  const bed = { start: 22 * 60, end: 7 * 60 };
  it('handles windows that cross midnight', () => {
    expect(isBedtime(Date.UTC(2026, 0, 1, 23, 30), bed)).toBe(true);
    expect(isBedtime(Date.UTC(2026, 0, 1, 3, 0), bed)).toBe(true);
    expect(isBedtime(Date.UTC(2026, 0, 1, 7, 0), bed)).toBe(false);
    expect(isBedtime(Date.UTC(2026, 0, 1, 12, 0), bed)).toBe(false);
  });

  it('handles same-day windows and disabled schedules', () => {
    const nap = { start: 13 * 60, end: 15 * 60 };
    expect(isBedtime(Date.UTC(2026, 0, 1, 14, 0), nap)).toBe(true);
    expect(isBedtime(Date.UTC(2026, 0, 1, 16, 0), nap)).toBe(false);
    expect(isBedtime(Date.UTC(2026, 0, 1, 14, 0), { start: 0, end: 0 })).toBe(false);
  });

  it('formats and parses clock times', () => {
    expect(localMinutes(Date.UTC(2026, 0, 1, 7, 5))).toBe(425);
    expect(formatClock(425)).toBe('07:05');
    expect(parseClock('22:00')).toBe(1320);
    expect(parseClock('7:30')).toBe(450);
    expect(parseClock('24:00')).toBeNull();
    expect(parseClock('12:60')).toBeNull();
    expect(parseClock('noon')).toBeNull();
  });
});

describe('pet helpers', () => {
  it('creates an egg with full stats', () => {
    const p = createEgg({
      id: 'x',
      name: '  Bob  ',
      species: 'fox',
      color: 2,
      now: MORNING,
      seed: 9,
    });
    expect(p.stage).toBe('egg');
    expect(p.name).toBe('Bob');
    expect(p.lastTickAt).toBe(MORNING);
    expect(p.stats.health).toBe(100);
  });

  it('limits names to 12 characters, counting emoji as one', () => {
    expect(sanitizeName('ABCDEFGHIJKLMNOP')).toBe('ABCDEFGHIJKL');
    expect(sanitizeName('🐱🐱🐱🐱🐱🐱🐱🐱🐱🐱🐱🐱🐱')).toHaveLength(24);
  });

  it('clamps stats', () => {
    expect(clampStat(-5)).toBe(0);
    expect(clampStat(150)).toBe(100);
    const p = baby();
    addStat(p, 'hunger', 50);
    expect(p.stats.hunger).toBe(100);
    p.stats = { hunger: 40, happiness: 60, energy: 80, hygiene: 20, health: 0 };
    expect(careAverage(p.stats)).toBe(50);
  });
});
