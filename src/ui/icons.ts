import type { StatKey } from '../game/types';

// Emoji keep the bundle tiny and are colorful on every phone.
export const STAT_ICON: Record<StatKey, string> = {
  hunger: '🍗',
  happiness: '🎈',
  energy: '⚡',
  hygiene: '🧼',
  health: '❤️',
};

export const SPECIES_ICON = {
  cat: '🐱',
  dog: '🐶',
  bunny: '🐰',
  fox: '🦊',
  panda: '🐼',
  dragon: '🐲',
} as const;
