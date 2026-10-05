import { factIndexForDay, hasSeen } from '../game/facts';
import type { Pet } from '../game/types';
import { useAppStore } from '../store/useAppStore';

/** Today's fact that the pet wants to tell, if it hasn't been learned yet. */
export function useTodaysFact(pet: Pet, now: number): number | null {
  const seen = useAppStore((s) => s.game.progress.factsSeen);
  const index = factIndexForDay(pet, now);
  if (index === null || pet.asleep || hasSeen(seen, pet.species, index)) return null;
  return index;
}
