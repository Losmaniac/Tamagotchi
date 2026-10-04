// Pure Snack Catch simulation in normalised field coordinates (0–1).
import { createRng, type Rng } from '../game/rng';

export const SNACK_DURATION = 30; // seconds
export const PLAYER_Y = 0.86;
export const PLAYER_HALF_WIDTH = 0.11;
export const GOOD = ['🍓', '🍪', '🍙', '🍎', '🧁', '🍌'] as const;
export const BAD = '🥦';
const BAD_RATIO = 0.22;
export const GOOD_POINTS = 1;
export const BAD_PENALTY = 2;
/** Score that counts as a perfect game. */
export const SNACK_TARGET = 22;

export interface FallingItem {
  id: number;
  x: number;
  y: number;
  vy: number;
  bad: boolean;
  emoji: string;
}

export interface SnackState {
  time: number;
  items: FallingItem[];
  spawnIn: number;
  score: number;
  caught: number;
  over: boolean;
  nextId: number;
  rng: Rng;
}

export type SnackEvent = 'catch' | 'bad' | 'miss';

export function createSnackState(seed: number): SnackState {
  return {
    time: 0,
    items: [],
    spawnIn: 0.4,
    score: 0,
    caught: 0,
    over: false,
    nextId: 1,
    rng: createRng(seed),
  };
}

/** Difficulty ramps up over the game: faster spawns and falls. */
function difficulty(time: number): number {
  return Math.min(1, time / SNACK_DURATION);
}

/** Advances the game by `dt` seconds with the player centred at `playerX`. Mutates `s`. */
export function stepSnack(s: SnackState, dt: number, playerX: number): SnackEvent[] {
  if (s.over) return [];
  const events: SnackEvent[] = [];
  s.time += dt;
  const d = difficulty(s.time);

  s.spawnIn -= dt;
  if (s.spawnIn <= 0) {
    const bad = s.rng.chance(BAD_RATIO);
    s.items.push({
      id: s.nextId++,
      x: 0.08 + s.rng.next() * 0.84,
      y: -0.05,
      vy: 0.32 + d * 0.3 + s.rng.next() * 0.08,
      bad,
      emoji: bad ? BAD : GOOD[s.rng.int(0, GOOD.length - 1)]!,
    });
    s.spawnIn = 0.75 - d * 0.35;
  }

  const kept: FallingItem[] = [];
  for (const item of s.items) {
    const prevY = item.y;
    item.y += item.vy * dt;
    const crossing = prevY < PLAYER_Y && item.y >= PLAYER_Y - 0.03;
    if (crossing && Math.abs(item.x - playerX) <= PLAYER_HALF_WIDTH) {
      if (item.bad) {
        s.score = Math.max(0, s.score - BAD_PENALTY);
        events.push('bad');
      } else {
        s.score += GOOD_POINTS;
        s.caught += 1;
        events.push('catch');
      }
      continue;
    }
    if (item.y > 1.05) {
      if (!item.bad) events.push('miss');
      continue;
    }
    kept.push(item);
  }
  s.items = kept;
  if (s.time >= SNACK_DURATION) s.over = true;
  return events;
}

export function snackNormalized(score: number): number {
  return Math.min(1, score / SNACK_TARGET);
}
