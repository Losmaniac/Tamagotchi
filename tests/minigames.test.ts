import { describe, expect, it } from 'vitest';
import { leftRightNormalized, makeTurns, ROUNDS } from '../src/minigames/leftRightLogic';
import {
  BEAT_MS,
  GOOD_MS,
  NOTE_COUNT,
  expire,
  isRhythmOver,
  judge,
  makeNotes,
  rhythmNormalized,
  rhythmScore,
  tap,
} from '../src/minigames/rhythmLogic';
import {
  PLAYER_Y,
  SNACK_DURATION,
  createSnackState,
  snackNormalized,
  stepSnack,
} from '../src/minigames/snackCatchLogic';

describe('snack catch', () => {
  it('spawns items, catches the ones under the player and ends after 30 s', () => {
    const s = createSnackState(7);
    let caught = 0;
    let events = 0;
    // A perfect tracker: always stand under the lowest good item.
    for (let t = 0; t < SNACK_DURATION + 1; t += 1 / 60) {
      const target = s.items.filter((i) => !i.bad && i.y < PLAYER_Y).sort((a, b) => b.y - a.y)[0];
      const ev = stepSnack(s, 1 / 60, target ? target.x : 0.5);
      events += ev.length;
      caught += ev.filter((e) => e === 'catch').length;
    }
    expect(s.over).toBe(true);
    expect(caught).toBeGreaterThan(15);
    expect(events).toBeGreaterThan(caught - 1);
    expect(snackNormalized(s.score)).toBeGreaterThan(0.6);
    expect(stepSnack(s, 1, 0.5)).toEqual([]);
  });

  it('penalises broccoli and never goes below zero', () => {
    const s = createSnackState(1);
    s.items.push({ id: 99, x: 0.5, y: PLAYER_Y - 0.01, vy: 1, bad: true, emoji: '🥦' });
    expect(stepSnack(s, 0.02, 0.5)).toContain('bad');
    expect(s.score).toBe(0);
  });

  it('a player who never moves misses most snacks', () => {
    const s = createSnackState(3);
    for (let t = 0; t < SNACK_DURATION + 1; t += 1 / 30) stepSnack(s, 1 / 30, 0.02);
    expect(snackNormalized(s.score)).toBeLessThan(0.3);
  });
});

describe('rhythm tap', () => {
  it('builds a deterministic chart', () => {
    const a = makeNotes(5);
    expect(a).toHaveLength(NOTE_COUNT);
    expect(makeNotes(5)).toEqual(a);
    expect(a[1]!.time - a[0]!.time).toBeGreaterThanOrEqual(BEAT_MS / 2);
  });

  it('judges timing windows', () => {
    expect(judge(0)).toBe('perfect');
    expect(judge(-60)).toBe('perfect');
    expect(judge(120)).toBe('good');
    expect(judge(-200)).toBe('miss');
  });

  it('taps hit the nearest open note; stray taps are ignored', () => {
    const notes = makeNotes(1);
    expect(tap(notes, notes[0]!.time + 10)).toBe('perfect');
    expect(tap(notes, notes[0]!.time + 10)).toBeNull();
    expect(tap(notes, notes[1]!.time - 100)).toBe('good');
    expect(tap(notes, -10_000)).toBeNull();
  });

  it('expires unplayed notes and scores the run', () => {
    const notes = makeNotes(2);
    for (const n of notes) tap(notes, n.time);
    expect(rhythmNormalized(notes)).toBe(1);
    const lazy = makeNotes(2);
    expect(expire(lazy, lazy[lazy.length - 1]!.time + GOOD_MS + 1)).toBe(NOTE_COUNT);
    expect(isRhythmOver(lazy)).toBe(true);
    expect(rhythmScore(lazy)).toBe(0);
  });
});

describe('left or right', () => {
  it('makes 5 seeded turns and scores wins', () => {
    const turns = makeTurns(9);
    expect(turns).toHaveLength(ROUNDS);
    expect(makeTurns(9)).toEqual(turns);
    expect(new Set(makeTurns(1, 50)).size).toBe(2);
    expect(leftRightNormalized(3)).toBe(0.6);
    expect(leftRightNormalized(9)).toBe(1);
  });
});
