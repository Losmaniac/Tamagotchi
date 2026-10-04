import { getItem, type Inventory } from '../game/shop';
import type { Pet } from '../game/types';
import { themeGradient } from '../three/palette';

/** Background for the pet: species theme or an equipped shop background. */
export function backgroundFor(pet: Pet, inventory: Inventory): string {
  const bg = inventory.equipped.background ? getItem(inventory.equipped.background) : undefined;
  return themeGradient(pet.species, bg ? [bg.color, bg.accent ?? bg.color] : undefined);
}
