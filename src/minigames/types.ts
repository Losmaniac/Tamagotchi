import type { Species } from '../game/types';

export interface MinigameProps {
  species: Species;
  /** Called once with the normalised score (0–1) and the raw score. */
  onFinish: (normalized: number, raw: number) => void;
  reduced: boolean;
}
