// Core game types. Pure TS: no framework imports.

export const SPECIES = ['cat', 'dog', 'bunny', 'fox', 'panda', 'dragon'] as const;
export type Species = (typeof SPECIES)[number];

export const COLOR_VARIANTS = [0, 1, 2] as const;
export type ColorVariant = (typeof COLOR_VARIANTS)[number];

export const STAGES = ['egg', 'baby', 'child', 'teen', 'adult', 'senior'] as const;
export type Stage = (typeof STAGES)[number];

export type Form = 'normal' | 'star' | 'grumpy';

export const CARE_STATS = ['hunger', 'happiness', 'energy', 'hygiene'] as const;
export type CareStat = (typeof CARE_STATS)[number];
export type StatKey = CareStat | 'health';
export type Stats = Record<StatKey, number>;

export type CallKind = CareStat | 'lights';
export type ActUpKind = 'refuseFood' | 'fakeCall';
export type DeathCause = 'sickness' | 'neglect' | 'oldAge';
export type SleepReason = 'bedtime' | 'nap' | 'exhausted';

export interface Bedtime {
  /** Minutes after local midnight. */
  start: number;
  end: number;
}

export interface Call {
  since: number;
  /** True once it has been counted as a care mistake. */
  missed: boolean;
}

export interface StageRecord {
  /** Running sum of the average care-stat value, sampled each sim step. */
  statSum: number;
  samples: number;
  careMistakes: number;
  ignoredActs: number;
}

export interface Pet {
  id: string;
  name: string;
  species: Species;
  color: ColorVariant;
  stage: Stage;
  form: Form;
  bornAt: number;
  hatchedAt: number | null;
  stageStartedAt: number;
  /** Real-time duration of the current stage in ms (senior is randomised on entry). */
  stageDuration: number;
  /** Extra hatch progress earned by warming the egg (ms). */
  eggWarmth: number;

  /** 0–100. Stored with fractional precision; display rounds. */
  stats: Stats;
  asleep: boolean;
  sleepReason: SleepReason | null;
  /** Woken during bedtime: stays awake until this timestamp. */
  stayAwakeUntil: number;
  lightsOn: boolean;

  sick: boolean;
  medicineDosesLeft: number;
  poops: number;
  /** Awake time (ms) left until the next poop. */
  poopTimer: number;
  snackTimes: number[];
  lastStrokeAt: number;

  discipline: number;
  actingUp: { kind: ActUpKind; since: number } | null;
  calls: Partial<Record<CallKind, Call>>;
  /** When each care stat first hit 0 (cleared when it rises again). */
  zeroSince: Partial<Record<CareStat, number>>;

  stageRecord: StageRecord;
  totalCareMistakes: number;
  /** Day index of age (since hatch) for which survival coins were last paid. */
  survivalDaysPaid: number;
  /** Care mistakes made during the current day of age (for "perfect day"). */
  dayMistakes: number;

  /** mulberry32 state — makes catch-up deterministic and testable. */
  rng: number;
  /** Simulated up to this timestamp. */
  lastTickAt: number;

  /** First pet: needs drain slower until `gentleUntil` (set on hatching). */
  beginner: boolean;
  gentleUntil: number;
  /** Time spent asleep at night with the lights on (reset at bedtime). */
  nightLightsOnMs: number;

  dead: boolean;
  deathCause: DeathCause | null;
  diedAt: number | null;
}

export interface MemorialEntry {
  id: string;
  name: string;
  species: Species;
  color: ColorVariant;
  form: Form;
  stage: Stage;
  bornAt: number;
  diedAt: number;
  /** Age since hatching, ms. */
  age: number;
  cause: DeathCause;
  careMistakes: number;
}

export type LogType =
  | 'hatched'
  | 'evolved'
  | 'poop'
  | 'sick'
  | 'cured'
  | 'fellAsleep'
  | 'wokeUp'
  | 'careMistake'
  | 'actedUp'
  | 'died'
  | 'coins';

export interface LogEntry {
  t: number;
  type: LogType;
  value?: string | number;
}

/** Events emitted by the simulation; the store turns some into log entries / summary lines. */
export type SimEvent =
  | { type: 'hatched'; t: number }
  | { type: 'evolved'; t: number; stage: Stage; form: Form }
  | { type: 'poop'; t: number }
  | { type: 'sick'; t: number }
  | { type: 'cured'; t: number }
  | { type: 'fellAsleep'; t: number; reason: SleepReason }
  | { type: 'wokeUp'; t: number }
  | { type: 'careMistake'; t: number; call: CallKind }
  | { type: 'actedUp'; t: number; kind: ActUpKind }
  | { type: 'actIgnored'; t: number }
  | { type: 'perfectDay'; t: number }
  | { type: 'coins'; t: number; amount: number }
  | { type: 'birthday'; t: number; days: number }
  | { type: 'wellRested'; t: number }
  | { type: 'died'; t: number; cause: DeathCause };
