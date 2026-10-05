import type { Species } from './types';

export interface Snack {
  id: string;
  emoji: string;
  /** Sweet treats are more fun; healthy snacks give a little health instead. */
  sweet: boolean;
  happiness: number;
  health: number;
}

export const SNACKS = [
  { id: 'apple', emoji: '🍎', sweet: false, happiness: 4, health: 2 },
  { id: 'carrot', emoji: '🥕', sweet: false, happiness: 4, health: 2 },
  { id: 'berries', emoji: '🫐', sweet: false, happiness: 5, health: 2 },
  { id: 'fish', emoji: '🐟', sweet: false, happiness: 4, health: 2 },
  { id: 'bamboo', emoji: '🎋', sweet: false, happiness: 3, health: 2 },
  { id: 'chili', emoji: '🌶️', sweet: false, happiness: 5, health: 1 },
  { id: 'bone', emoji: '🦴', sweet: false, happiness: 6, health: 1 },
  { id: 'worm', emoji: '🪱', sweet: false, happiness: 5, health: 2 },
  { id: 'cricket', emoji: '🦗', sweet: false, happiness: 5, health: 2 },
  { id: 'lettuce', emoji: '🥬', sweet: false, happiness: 3, health: 3 },
  { id: 'lemon', emoji: '🍋', sweet: false, happiness: 6, health: 2 },
  { id: 'cookie', emoji: '🍪', sweet: true, happiness: 10, health: 0 },
  { id: 'cupcake', emoji: '🧁', sweet: true, happiness: 12, health: -1 },
] as const satisfies readonly Snack[];

export type SnackId = (typeof SNACKS)[number]['id'];

/** Each species has a secret favourite, discovered by trying. */
export const FAVORITE_FOOD: Record<Species, SnackId> = {
  cat: 'fish',
  dog: 'bone',
  bunny: 'carrot',
  fox: 'berries',
  panda: 'bamboo',
  dragon: 'chili',
  axolotl: 'worm',
  penguin: 'fish',
  owl: 'cricket',
  turtle: 'lettuce',
  sparky: 'lemon',
};

export function getSnack(id: string): Snack | undefined {
  return SNACKS.find((s) => s.id === id);
}

export function isSnackId(id: unknown): id is SnackId {
  return typeof id === 'string' && SNACKS.some((s) => s.id === id);
}
