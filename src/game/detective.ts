// Detective mode: when the pet gets sick, the player studies the clues and names the cause.
import { DETECTIVE_COINS, SICK_LOW_HUNGER, SICK_LOW_HYGIENE, OVERFEED_SNACKS } from './constants';
import type { Pet, SickCause, SickClues } from './types';

export function hasOpenCase(pet: Pet): boolean {
  return pet.sick && !pet.caseSolved && pet.sickCause !== null && pet.sickClues !== null;
}

export type ClueKey = 'hygiene' | 'hunger' | 'energy' | 'poops' | 'snacks';

/** Each clue with whether it looks suspicious (shown as a hint after answering). */
export function clueList(clues: SickClues): { key: ClueKey; value: number; suspicious: boolean }[] {
  return [
    { key: 'hygiene', value: clues.hygiene, suspicious: clues.hygiene < SICK_LOW_HYGIENE },
    { key: 'poops', value: clues.poops, suspicious: clues.poops >= 2 },
    { key: 'hunger', value: clues.hunger, suspicious: clues.hunger < SICK_LOW_HUNGER },
    { key: 'snacks', value: clues.snacks, suspicious: clues.snacks > OVERFEED_SNACKS },
    { key: 'energy', value: clues.energy, suspicious: false },
  ];
}

export interface CaseResult {
  pet: Pet;
  correct: boolean;
  answer: SickCause;
  coins: number;
}

/** One guess per sickness; a correct guess pays a few coins. Mutates nothing. */
export function solveCase(input: Pet, guess: SickCause): CaseResult | null {
  if (!hasOpenCase(input)) return null;
  const answer = input.sickCause!;
  const correct = guess === answer;
  return {
    pet: { ...input, caseSolved: true },
    correct,
    answer,
    coins: correct ? DETECTIVE_COINS : 0,
  };
}
