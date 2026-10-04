import type { DeathCause, MemorialEntry, Pet } from './types';

export function killPet(pet: Pet, t: number, cause: DeathCause): void {
  pet.dead = true;
  pet.deathCause = cause;
  pet.diedAt = t;
  pet.asleep = false;
  pet.sleepReason = null;
  pet.actingUp = null;
  pet.calls = {};
}

export function petAge(pet: Pet, now: number): number {
  if (pet.hatchedAt === null) return 0;
  const end = pet.diedAt ?? now;
  return Math.max(0, end - pet.hatchedAt);
}

export function toMemorial(pet: Pet): MemorialEntry | null {
  if (!pet.dead || pet.diedAt === null || pet.deathCause === null) return null;
  return {
    id: pet.id,
    name: pet.name,
    species: pet.species,
    color: pet.color,
    form: pet.form,
    stage: pet.stage,
    bornAt: pet.bornAt,
    diedAt: pet.diedAt,
    age: petAge(pet, pet.diedAt),
    cause: pet.deathCause,
    careMistakes: pet.totalCareMistakes,
  };
}
