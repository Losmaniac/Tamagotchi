// Real-world data for each species' wild cousin (texts live in src/i18n/learn.ts).
// Ages and lifespans are rounded, typical values.
import type { Species, Stage } from './types';

/** IUCN Red List categories, least to most threatened. */
export const IUCN = ['LC', 'NT', 'VU', 'EN', 'CR'] as const;
export type IucnStatus = (typeof IUCN)[number];

export const REGIONS = ['na', 'sa', 'eu', 'af', 'as', 'oc', 'an', 'sea'] as const;
export type Region = (typeof REGIONS)[number];

export type AgeUnit = 'week' | 'month' | 'year';
/** A real age range for one life stage; `to: null` means "and older". */
export interface AgeRange {
  from: number;
  to: number | null;
  unit: AgeUnit;
}

export type LifeStage = Exclude<Stage, 'egg'>;

export interface WildInfo {
  /** Pets (cat, dog, bunny): lifespan and ages are for the pet animal, not the wild cousin. */
  domestic?: boolean;
  /** Scientific (Latin) name. */
  latin: string;
  status: IucnStatus;
  regions: Region[];
  /** Typical lifespan in years [min, max]. */
  lifespan: [number, number];
  stages: Record<LifeStage, AgeRange>;
}

const r = (from: number, to: number | null, unit: AgeUnit): AgeRange => ({ from, to, unit });

export const WILD: Record<Species, WildInfo> = {
  cat: {
    domestic: true,
    latin: 'Felis lybica',
    status: 'LC',
    regions: ['af', 'as'],
    lifespan: [12, 18],
    stages: {
      baby: r(0, 2, 'month'),
      child: r(2, 6, 'month'),
      teen: r(6, 18, 'month'),
      adult: r(2, 10, 'year'),
      senior: r(11, null, 'year'),
    },
  },
  dog: {
    domestic: true,
    latin: 'Canis lupus',
    status: 'LC',
    regions: ['na', 'eu', 'as'],
    lifespan: [10, 13],
    stages: {
      baby: r(0, 2, 'month'),
      child: r(2, 6, 'month'),
      teen: r(6, 18, 'month'),
      adult: r(2, 7, 'year'),
      senior: r(8, null, 'year'),
    },
  },
  bunny: {
    domestic: true,
    latin: 'Oryctolagus cuniculus',
    status: 'EN',
    regions: ['eu'],
    lifespan: [8, 12],
    stages: {
      baby: r(0, 2, 'month'),
      child: r(2, 4, 'month'),
      teen: r(4, 9, 'month'),
      adult: r(1, 5, 'year'),
      senior: r(6, null, 'year'),
    },
  },
  fox: {
    latin: 'Vulpes vulpes',
    status: 'LC',
    regions: ['na', 'eu', 'as', 'af'],
    lifespan: [2, 5],
    stages: {
      baby: r(0, 1, 'month'),
      child: r(1, 4, 'month'),
      teen: r(4, 10, 'month'),
      adult: r(1, 4, 'year'),
      senior: r(5, null, 'year'),
    },
  },
  panda: {
    latin: 'Ailuropoda melanoleuca',
    status: 'VU',
    regions: ['as'],
    lifespan: [15, 20],
    stages: {
      baby: r(0, 6, 'month'),
      child: r(6, 18, 'month'),
      teen: r(2, 5, 'year'),
      adult: r(5, 20, 'year'),
      senior: r(20, null, 'year'),
    },
  },
  dragon: {
    latin: 'Varanus komodoensis',
    status: 'EN',
    regions: ['as'],
    lifespan: [25, 30],
    stages: {
      baby: r(0, 1, 'year'),
      child: r(1, 4, 'year'),
      teen: r(4, 8, 'year'),
      adult: r(8, 25, 'year'),
      senior: r(25, null, 'year'),
    },
  },
  axolotl: {
    latin: 'Ambystoma mexicanum',
    status: 'CR',
    regions: ['na'],
    lifespan: [10, 15],
    stages: {
      baby: r(0, 3, 'month'),
      child: r(3, 6, 'month'),
      teen: r(6, 12, 'month'),
      adult: r(1, 8, 'year'),
      senior: r(8, null, 'year'),
    },
  },
  penguin: {
    latin: 'Aptenodytes forsteri',
    status: 'NT',
    regions: ['an'],
    lifespan: [15, 20],
    stages: {
      baby: r(0, 2, 'month'),
      child: r(2, 5, 'month'),
      teen: r(1, 4, 'year'),
      adult: r(4, 15, 'year'),
      senior: r(15, null, 'year'),
    },
  },
  owl: {
    latin: 'Tyto alba',
    status: 'LC',
    regions: ['na', 'sa', 'eu', 'af', 'as', 'oc'],
    lifespan: [2, 4],
    stages: {
      baby: r(0, 2, 'month'),
      child: r(2, 3, 'month'),
      teen: r(3, 10, 'month'),
      adult: r(1, 4, 'year'),
      senior: r(5, null, 'year'),
    },
  },
  turtle: {
    latin: 'Chelonia mydas',
    status: 'LC',
    regions: ['sea'],
    lifespan: [60, 80],
    stages: {
      baby: r(0, 1, 'year'),
      child: r(1, 10, 'year'),
      teen: r(10, 25, 'year'),
      adult: r(25, 60, 'year'),
      senior: r(60, null, 'year'),
    },
  },
  sparky: {
    latin: 'Electrophorus electricus',
    status: 'LC',
    regions: ['sa'],
    lifespan: [10, 15],
    stages: {
      baby: r(0, 6, 'month'),
      child: r(6, 24, 'month'),
      teen: r(2, 4, 'year'),
      adult: r(4, 12, 'year'),
      senior: r(12, null, 'year'),
    },
  },
};
