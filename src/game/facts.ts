// Daily animal facts: which fact a pet tells today, what was learned, quiz questions.
import { FACTS_PER_SPECIES, QUIZ_QUESTIONS } from './constants';
import { createRng } from './rng';
import { SPECIES, type Pet, type Species } from './types';

export type FactsSeen = Partial<Record<Species, number>>; // bitmask per species

export function factIndexForDay(pet: Pet, now: number): number | null {
  if (pet.hatchedAt === null || pet.dead) return null;
  // Clamp: the UI clock can be a moment behind the hatch time.
  const day = Math.max(0, Math.floor((now - pet.hatchedAt) / 86_400_000));
  return day % FACTS_PER_SPECIES;
}

export function hasSeen(seen: FactsSeen, species: Species, index: number): boolean {
  return ((seen[species] ?? 0) & (1 << index)) !== 0;
}

export function markSeen(seen: FactsSeen, species: Species, index: number): FactsSeen {
  if (!Number.isInteger(index) || index < 0 || index >= FACTS_PER_SPECIES) return seen;
  return { ...seen, [species]: (seen[species] ?? 0) | (1 << index) };
}

export function learnedFacts(seen: FactsSeen): { species: Species; index: number }[] {
  const out: { species: Species; index: number }[] = [];
  for (const species of SPECIES)
    for (let i = 0; i < FACTS_PER_SPECIES; i++)
      if (hasSeen(seen, species, i)) out.push({ species, index: i });
  return out;
}

export interface QuizQuestion {
  species: Species;
  index: number;
  options: Species[];
}

/** "Which animal is this about?" questions drawn from learned facts. */
export function makeQuiz(seen: FactsSeen, seed: number, count = QUIZ_QUESTIONS): QuizQuestion[] {
  const rng = createRng(seed);
  const pool = learnedFacts(seen);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, count).map(({ species, index }) => {
    const others = SPECIES.filter((s) => s !== species);
    const picks: Species[] = [species];
    while (picks.length < 3) {
      const s = others[rng.int(0, others.length - 1)]!;
      if (!picks.includes(s)) picks.push(s);
    }
    for (let i = picks.length - 1; i > 0; i--) {
      const j = rng.int(0, i);
      [picks[i], picks[j]] = [picks[j]!, picks[i]!];
    }
    return { species, index, options: picks };
  });
}
