// Pure "Word Snack" logic: pick the translation, feed your pal.
import { createRng } from '../game/rng';

export const WORD_ROUNDS = 8;
export const WORD_OPTIONS = 3;

export interface WordRound {
  answer: number;
  options: number[];
}

export function makeWordRounds(seed: number, wordCount: number, rounds = WORD_ROUNDS): WordRound[] {
  const rng = createRng(seed);
  const order = Array.from({ length: wordCount }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order.slice(0, Math.min(rounds, wordCount)).map((answer) => {
    const options = [answer];
    while (options.length < Math.min(WORD_OPTIONS, wordCount)) {
      const k = rng.int(0, wordCount - 1);
      if (!options.includes(k)) options.push(k);
    }
    for (let i = options.length - 1; i > 0; i--) {
      const j = rng.int(0, i);
      [options[i], options[j]] = [options[j]!, options[i]!];
    }
    return { answer, options };
  });
}

export function wordNormalized(correct: number, rounds = WORD_ROUNDS): number {
  return Math.min(1, Math.max(0, correct / rounds));
}
