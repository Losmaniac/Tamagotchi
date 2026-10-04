import { MEDICINE_DOSES_MAX, MEDICINE_DOSES_MIN } from './constants';
import type { Rng } from './rng';
import type { Pet, SimEvent } from './types';

export function makeSick(pet: Pet, t: number, rng: Rng, events: SimEvent[]): void {
  if (pet.sick) return;
  pet.sick = true;
  pet.medicineDosesLeft = rng.int(MEDICINE_DOSES_MIN, MEDICINE_DOSES_MAX);
  events.push({ type: 'sick', t });
}
