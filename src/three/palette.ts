import { Color } from 'three';
import type { ColorVariant, Form, Species, Stage } from '../game/types';

export interface SpeciesColors {
  body: string;
  belly: string;
  /** Ears tips, patches, horns, spots… */
  accent: string;
  /** Inner ears, nose, blush. */
  pink: string;
}

export interface SpeciesTheme {
  /** Pastel gradient behind the pet (top → bottom). */
  background: [string, string];
  variants: [SpeciesColors, SpeciesColors, SpeciesColors];
}

export const SPECIES_THEMES: Record<Species, SpeciesTheme> = {
  cat: {
    background: ['#ffd8c2', '#ffb3c6'],
    variants: [
      { body: '#ff9f43', belly: '#fff1e0', accent: '#e8742a', pink: '#ff8fb1' },
      { body: '#a3adbd', belly: '#f7f7fb', accent: '#6c7689', pink: '#ff9fc0' },
      { body: '#4b4462', belly: '#ece6ff', accent: '#2c2740', pink: '#ff7fb0' },
    ],
  },
  dog: {
    background: ['#c6f1ff', '#fff3c4'],
    variants: [
      { body: '#f4b860', belly: '#fff3dc', accent: '#c27c2c', pink: '#ff8fa3' },
      { body: '#a9714b', belly: '#f3dcc4', accent: '#6e4428', pink: '#ff8fa3' },
      { body: '#f6f1e9', belly: '#ffffff', accent: '#5a4636', pink: '#ff9fb5' },
    ],
  },
  bunny: {
    background: ['#ffe0f0', '#e6dcff'],
    variants: [
      { body: '#fbf7f4', belly: '#ffffff', accent: '#e9ddd7', pink: '#ffa5c4' },
      { body: '#ffb5d0', belly: '#ffe6f0', accent: '#ff86b3', pink: '#ff6fa5' },
      { body: '#c8b6ff', belly: '#f1ebff', accent: '#9d86f0', pink: '#ff9fd0' },
    ],
  },
  fox: {
    background: ['#ffe5b4', '#ffc2a8'],
    variants: [
      { body: '#ff7b39', belly: '#fff6ec', accent: '#3d2a2a', pink: '#ff8fa3' },
      { body: '#eef3ff', belly: '#ffffff', accent: '#9fb2d4', pink: '#ffa5c4' },
      { body: '#8e7cc3', belly: '#f3efff', accent: '#4b3c7a', pink: '#ff9fd0' },
    ],
  },
  panda: {
    background: ['#d8f5d0', '#c2ecff'],
    variants: [
      { body: '#fbfbfb', belly: '#ffffff', accent: '#2b2b38', pink: '#ff9fb5' },
      { body: '#f3e6d8', belly: '#fffaf3', accent: '#7a5230', pink: '#ff9fb5' },
      { body: '#ffe3ef', belly: '#fff6fa', accent: '#ff5fa2', pink: '#ff7fb0' },
    ],
  },
  dragon: {
    background: ['#d9c8ff', '#b8f0e0'],
    variants: [
      { body: '#5ee6a8', belly: '#fff3b0', accent: '#2fb37a', pink: '#ff9fb5' },
      { body: '#9d6bff', belly: '#ffd6f6', accent: '#6a3fd6', pink: '#ff8fd0' },
      { body: '#ff5d5d', belly: '#ffd39b', accent: '#c73a3a', pink: '#ffb0a0' },
    ],
  },
};

const tmpA = new Color();
const tmpB = new Color();

export function mix(a: string, b: string, t: number): string {
  return '#' + tmpA.set(a).lerp(tmpB.set(b), t).getHexString();
}

/**
 * Resolves the final colors for a pet, including form and stage tweaks:
 * Star = brighter, Grumpy = duller and darker, Senior = a little faded.
 */
export function resolveColors(
  species: Species,
  color: ColorVariant,
  form: Form,
  stage: Stage,
): SpeciesColors {
  const base = SPECIES_THEMES[species].variants[color];
  const adjust = (hex: string) => {
    let c = hex;
    if (form === 'star') c = mix(c, '#ffffff', 0.08);
    if (form === 'grumpy') c = mix(c, '#5b5470', 0.14);
    if (stage === 'senior') c = mix(c, '#c9c4cf', 0.25);
    return c;
  };
  return {
    body: adjust(base.body),
    belly: adjust(base.belly),
    accent: adjust(base.accent),
    pink: base.pink,
  };
}

export const SICK_TINT = '#8fd16a';

export function themeGradient(species: Species, override?: [string, string]): string {
  const [top, bottom] = override ?? SPECIES_THEMES[species].background;
  return `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`;
}
