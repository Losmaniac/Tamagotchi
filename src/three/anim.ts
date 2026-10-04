import type { ItemId } from '../game/shop';
import type { ColorVariant, Form, Species, Stage } from '../game/types';
import type { Mood } from '../game/status';

export type ReactionKind =
  | 'poke'
  | 'stroke'
  | 'eat'
  | 'snack'
  | 'hop'
  | 'play'
  | 'clean'
  | 'medicine'
  | 'scold'
  | 'refuse'
  | 'evolve';

/** Bump `id` to (re)trigger a reaction animation. */
export interface Reaction {
  kind: ReactionKind;
  id: number;
}

export interface ReactionState {
  kind: ReactionKind | null;
  /** Clock time (s) the reaction started. */
  start: number;
}

export const REACTION_DURATION: Record<ReactionKind, number> = {
  poke: 0.45,
  stroke: 1.2,
  eat: 1.4,
  snack: 1.2,
  hop: 1.0,
  play: 1.0,
  clean: 1.2,
  medicine: 0.9,
  scold: 0.8,
  refuse: 0.8,
  evolve: 1.6,
};

export function reactionProgress(r: ReactionState, now: number): number | null {
  if (!r.kind) return null;
  const p = (now - r.start) / REACTION_DURATION[r.kind];
  return p >= 0 && p < 1 ? p : null;
}

export interface PetLook {
  species: Species;
  color: ColorVariant;
  stage: Stage;
  form: Form;
}

export interface Equipped {
  hat?: ItemId;
  glasses?: ItemId;
  scarf?: ItemId;
}

/** Visual pose targets shared by the rig and the model (read in useFrame, no re-render). */
export interface Pose {
  droop: number; // 0–1 head hangs down
  tilt: number; // radians, head roll
}

export type { Mood };
