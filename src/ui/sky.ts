import { getItem, type Inventory } from '../game/shop';
import type { Species } from '../game/types';
import type { SkyPhase } from '../game/world';
import { mix, SPECIES_THEMES } from '../three/palette';

const PHASE: Record<SkyPhase, [string, string] | null> = {
  night: ['#1e1b4b', '#5b21b6'],
  dawn: ['#fbcfe8', '#fde68a'],
  day: null,
  golden: ['#fdba74', '#f9a8d4'],
  dusk: ['#6d28d9', '#f472b6'],
};

const WEIGHT: Record<SkyPhase, number> = {
  night: 0.78,
  dawn: 0.45,
  day: 0,
  golden: 0.5,
  dusk: 0.6,
};

/** Background gradient: species theme (or shop background) tinted by the real time of day. */
export function skyGradient(species: Species, inventory: Inventory, phase: SkyPhase): string {
  const bg = inventory.equipped.background ? getItem(inventory.equipped.background) : undefined;
  const base: [string, string] = bg
    ? [bg.color, bg.accent ?? bg.color]
    : SPECIES_THEMES[species].background;
  const tint = PHASE[phase];
  const w = bg ? WEIGHT[phase] * 0.6 : WEIGHT[phase];
  const [top, bottom] = tint ? [mix(base[0], tint[0], w), mix(base[1], tint[1], w)] : base;
  return `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`;
}

export function isDarkSky(phase: SkyPhase): boolean {
  return phase === 'night' || phase === 'dusk';
}
