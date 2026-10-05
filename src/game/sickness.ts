import { MEDICINE_DOSES_MAX, MEDICINE_DOSES_MIN, OVERFEED_WINDOW } from './constants';
import type { Rng } from './rng';
import type { Pet, SickCause, SickClues, SimEvent } from './types';

/** Snapshot of the evidence a detective case shows. */
export function collectClues(pet: Pet, t: number): SickClues {
  return {
    hygiene: Math.round(pet.stats.hygiene),
    hunger: Math.round(pet.stats.hunger),
    energy: Math.round(pet.stats.energy),
    poops: pet.poops,
    snacks: pet.snackTimes.filter((s) => t - s < OVERFEED_WINDOW).length,
  };
}

export function makeSick(
  pet: Pet,
  t: number,
  rng: Rng,
  events: SimEvent[],
  cause: SickCause = 'bug',
): void {
  if (pet.sick) return;
  pet.sick = true;
  pet.medicineDosesLeft = rng.int(MEDICINE_DOSES_MIN, MEDICINE_DOSES_MAX);
  pet.sickCause = cause;
  pet.sickClues = collectClues(pet, t);
  pet.caseSolved = false;
  events.push({ type: 'sick', t });
}
