// Pure "Word Snack" logic: pick the translation, feed your pal.
// Words come from one themed pack; spaced repetition puts missed words first.
import { createRng } from '../game/rng';
import { pickWords } from '../game/words';

export const WORD_ROUNDS = 8;
export const WORD_OPTIONS = 3;

export interface WordRound {
  /** Word id of the right answer. */
  answer: string;
  /** Word ids in display order (including the answer). */
  options: string[];
}

export function makeWordRounds(
  seed: number,
  ids: readonly string[],
  boxes: Record<string, number> = {},
  rounds = WORD_ROUNDS,
): WordRound[] {
  const rng = createRng(seed);
  const chosen = pickWords(ids, boxes, Math.min(rounds, ids.length), rng);
  // Shuffle the round order so missed words don't always come first.
  for (let i = chosen.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [chosen[i], chosen[j]] = [chosen[j]!, chosen[i]!];
  }
  return chosen.map((answer) => {
    const options = [answer];
    while (options.length < Math.min(WORD_OPTIONS, ids.length)) {
      const k = ids[rng.int(0, ids.length - 1)]!;
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
