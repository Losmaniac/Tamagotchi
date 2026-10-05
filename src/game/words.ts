// Spaced repetition for Word Snack (a simple Leitner system).
// Missed words drop to box 0 and come back first; correct answers move a word up a box.
import { WORD_LEARNED_BOX, WORD_MAX_BOX } from './constants';
import type { Rng } from './rng';

/** Unseen words sit between missed (0) and practised (2+) words. */
export const UNSEEN_BOX = 1;

export function nextBox(box: number | undefined, correct: boolean): number {
  if (!correct) return 0;
  return Math.min(WORD_MAX_BOX, (box ?? UNSEEN_BOX) + 1);
}

export function isLearned(box: number | undefined): boolean {
  return (box ?? 0) >= WORD_LEARNED_BOX;
}

/** Picks `count` word ids, lowest boxes first (random order within a box). */
export function pickWords(
  ids: readonly string[],
  boxes: Record<string, number>,
  count: number,
  rng: Rng,
): string[] {
  const keyed = ids.map((id) => ({ id, box: boxes[id] ?? UNSEEN_BOX, r: rng.next() }));
  keyed.sort((a, b) => a.box - b.box || a.r - b.r);
  return keyed.slice(0, count).map((k) => k.id);
}

export function learnedCount(ids: readonly string[], boxes: Record<string, number>): number {
  return ids.filter((id) => isLearned(boxes[id])).length;
}
