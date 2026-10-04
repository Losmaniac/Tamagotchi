// Pure "Left or Right" (classic guessing game) logic.
import { createRng } from '../game/rng';

export const ROUNDS = 5;
export type Side = 'left' | 'right';

export function makeTurns(seed: number, rounds = ROUNDS): Side[] {
  const rng = createRng(seed);
  return Array.from({ length: rounds }, () => (rng.chance(0.5) ? 'left' : 'right'));
}

export function leftRightNormalized(wins: number, rounds = ROUNDS): number {
  return Math.min(1, Math.max(0, wins / rounds));
}
