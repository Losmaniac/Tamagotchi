// Persisted save shape, defaults, migrations and import validation. Pure TS.

import { createBank, type Bank } from './bank';
import { BUDGET_GOALS, type Budget } from './budget';
import { emptyDay } from './diary';
import { EXPERIMENT_IDS, type Experiment } from './experiments';
import { BODY_TOPICS, isMood, type BodyTopic, type MoodEntry } from './learning';
import { FOOD_GROUPS, type FoodGroup, type Plate } from './nutrition';
import {
  BANK_HISTORY_LIMIT,
  DEFAULT_BEDTIME,
  DIARY_DAYS,
  MOOD_DAYS,
  START_COINS,
  WORD_MAX_BOX,
} from './constants';
import type { DiaryDay } from './diary';
import type { FactsSeen } from './facts';
import { isSnackId, type SnackId } from './food';
import { isItemId, ITEM_SLOTS, type Inventory } from './shop';
import {
  CARE_STATS,
  COLOR_VARIANTS,
  SICK_CAUSES,
  SPECIES,
  STAGES,
  type Bedtime,
  type LogEntry,
  type MemorialEntry,
  type Pet,
  type Species,
} from './types';

export const SCHEMA_VERSION = 3;
export const STORAGE_KEY = 'pocketpals:v1';

export type Locale = 'en' | 'cs';
export const MINIGAME_IDS = ['snackCatch', 'rhythmTap', 'leftRight', 'wordSnack'] as const;
export type MinigameId = (typeof MINIGAME_IDS)[number];

export interface Settings {
  locale: Locale;
  sound: boolean;
  haptics: boolean;
  lowPower: boolean;
  bedtime: Bedtime;
  installHintDismissed: boolean;
  /** Soft generated background music (off by default). */
  music: boolean;
  /** Pet speaks words in the other language too. */
  bilingual: boolean;
}

export interface Progress {
  hatched: number;
  bestStage: number;
  starForms: number;
  poopsCleaned: number;
  cures: number;
  gamesPlayed: number;
  /** Best normalised (0–1) score per mini-game. */
  bestScores: Partial<Record<MinigameId, number>>;
  perfectDays: number;
  streak: number;
  lastOpenDay: string | null;
  purchases: number;
  /** Encyclopedia: learned facts (bitmask per species). */
  factsSeen: FactsSeen;
  /** Favourite snacks discovered per species. */
  favorites: Partial<Record<Species, SnackId>>;
  lastQuizDay: string | null;
  /** Learning lab. */
  bodyTopics: BodyTopic[];
  casesSolved: number;
  casesCorrect: number;
  experimentsDone: number;
  budgetsDone: number;
  budgetGoalsMet: number;
  platesDone: number;
  /** Word Snack spaced repetition: Leitner box per word id. */
  words: Record<string, number>;
  /** Feelings check-ins (the player's own mood; never leaves the device). */
  moods: MoodEntry[];
  /** Day on which the pet speaks only the other language. */
  immersionDay: string | null;
}

export interface GameState {
  pet: Pet | null;
  coins: number;
  memorial: MemorialEntry[];
  log: LogEntry[];
  achievements: Partial<Record<string, number>>;
  inventory: Inventory;
  progress: Progress;
  bank: Bank;
  diary: DiaryDay[];
  plate: Plate | null;
  experiment: Experiment | null;
  budget: Budget | null;
}

export interface SaveData {
  schemaVersion: number;
  settings: Settings;
  game: GameState;
}

export function createDefaultSettings(locale: Locale): Settings {
  return {
    locale,
    sound: true,
    haptics: true,
    lowPower: false,
    bedtime: { ...DEFAULT_BEDTIME },
    installHintDismissed: false,
    music: false,
    bilingual: false,
  };
}

export function createDefaultGame(): GameState {
  return {
    pet: null,
    coins: START_COINS,
    memorial: [],
    log: [],
    achievements: {},
    inventory: { owned: [], equipped: {} },
    progress: {
      hatched: 0,
      bestStage: 0,
      starForms: 0,
      poopsCleaned: 0,
      cures: 0,
      gamesPlayed: 0,
      bestScores: {},
      perfectDays: 0,
      streak: 0,
      lastOpenDay: null,
      purchases: 0,
      factsSeen: {},
      favorites: {},
      lastQuizDay: null,
      bodyTopics: [],
      casesSolved: 0,
      casesCorrect: 0,
      experimentsDone: 0,
      budgetsDone: 0,
      budgetGoalsMet: 0,
      platesDone: 0,
      words: {},
      moods: [],
      immersionDay: null,
    },
    bank: createBank(),
    diary: [],
    plate: null,
    experiment: null,
    budget: null,
  };
}

export function createDefaultSave(locale: Locale): SaveData {
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: createDefaultSettings(locale),
    game: createDefaultGame(),
  };
}

type Obj = Record<string, unknown>;
type Migration = (data: Obj) => Obj;

/**
 * migrations[n] upgrades a save from version n to n + 1.
 * Add an entry here whenever SaveData changes shape, then bump SCHEMA_VERSION.
 */
const migrations: Record<number, Migration> = {
  0: (data) => ({ ...data, schemaVersion: 1 }),
  // v2: gentle start, bedtime lights tracking (pet); bank, diary, facts (game); music/bilingual.
  1: (data) => {
    const game = isObj(data.game) ? { ...data.game } : {};
    if (isObj(game.pet))
      game.pet = { beginner: false, gentleUntil: 0, nightLightsOnMs: 0, ...game.pet };
    return { ...data, game, schemaVersion: 2 };
  },
  // v3: learning lab (detective fields on the pet; the rest is defaulted by sanitizeGame).
  2: (data) => {
    const game = isObj(data.game) ? { ...data.game } : {};
    if (isObj(game.pet))
      game.pet = { sickCause: null, sickClues: null, caseSolved: true, ...game.pet };
    return { ...data, game, schemaVersion: 3 };
  },
};

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isMinutes = (v: unknown): v is number => isNum(v) && v >= 0 && v < 1440;

function num(v: unknown, fallback: number): number {
  return isNum(v) ? v : fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

export function isValidPet(v: unknown): v is Pet {
  if (!isObj(v)) return false;
  const stats = v.stats;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    (SPECIES as readonly unknown[]).includes(v.species) &&
    (COLOR_VARIANTS as readonly unknown[]).includes(v.color) &&
    (STAGES as readonly unknown[]).includes(v.stage) &&
    ['normal', 'star', 'grumpy'].includes(v.form as string) &&
    isObj(stats) &&
    [...CARE_STATS, 'health'].every((k) => isNum(stats[k])) &&
    isNum(v.bornAt) &&
    isNum(v.stageStartedAt) &&
    isNum(v.stageDuration) &&
    isNum(v.lastTickAt) &&
    isNum(v.rng) &&
    isNum(v.gentleUntil) &&
    isNum(v.nightLightsOnMs) &&
    typeof v.dead === 'boolean' &&
    isObj(v.stageRecord) &&
    isObj(v.calls) &&
    isObj(v.zeroSince) &&
    Array.isArray(v.snackTimes)
  );
}

function sanitizeSettings(raw: unknown, fallback: Settings): Settings {
  const s = isObj(raw) ? raw : {};
  const bed = isObj(s.bedtime) ? s.bedtime : {};
  return {
    locale: s.locale === 'en' || s.locale === 'cs' ? s.locale : fallback.locale,
    sound: bool(s.sound, fallback.sound),
    haptics: bool(s.haptics, fallback.haptics),
    lowPower: bool(s.lowPower, fallback.lowPower),
    music: bool(s.music, fallback.music),
    bilingual: bool(s.bilingual, fallback.bilingual),
    installHintDismissed: bool(s.installHintDismissed, fallback.installHintDismissed),
    bedtime: {
      start: isMinutes(bed.start) ? bed.start : fallback.bedtime.start,
      end: isMinutes(bed.end) ? bed.end : fallback.bedtime.end,
    },
  };
}

function sanitizeFacts(raw: unknown): FactsSeen {
  const out: FactsSeen = {};
  if (!isObj(raw)) return out;
  for (const sp of SPECIES) {
    const v = raw[sp];
    if (isNum(v) && v >= 0) out[sp] = Math.floor(v);
  }
  return out;
}

function sanitizeFavorites(raw: unknown): Partial<Record<Species, SnackId>> {
  const out: Partial<Record<Species, SnackId>> = {};
  if (!isObj(raw)) return out;
  for (const sp of SPECIES) {
    const v = raw[sp];
    if (isSnackId(v)) out[sp] = v;
  }
  return out;
}

function sanitizeBank(raw: unknown): Bank {
  if (!isObj(raw)) return createBank();
  const history = Array.isArray(raw.history)
    ? raw.history.filter(
        (h): h is { t: number; balance: number } => isObj(h) && isNum(h.t) && isNum(h.balance),
      )
    : [];
  return {
    balance: Math.max(0, Math.floor(num(raw.balance, 0))),
    periodStart: num(raw.periodStart, 0),
    history: history.slice(-BANK_HISTORY_LIMIT),
  };
}

const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

function sanitizePet(raw: unknown): Pet | null {
  if (!isValidPet(raw)) return null;
  const pet = raw as Pet & Obj;
  const clues = pet.sickClues as unknown;
  const cluesOk =
    isObj(clues) &&
    ['hygiene', 'hunger', 'energy', 'poops', 'snacks'].every((k) => isNum(clues[k]));
  const cause = (SICK_CAUSES as readonly unknown[]).includes(pet.sickCause) ? pet.sickCause : null;
  return {
    ...pet,
    sickCause: cause,
    sickClues: cluesOk ? pet.sickClues : null,
    caseSolved: typeof pet.caseSolved === 'boolean' ? pet.caseSolved : true,
  };
}

function sanitizePlate(raw: unknown): Plate | null {
  if (!isObj(raw) || !isDay(raw.week) || !isObj(raw.counts)) return null;
  const counts = {} as Record<FoodGroup, number>;
  for (const g of FOOD_GROUPS) counts[g] = Math.max(0, Math.floor(num(raw.counts[g], 0)));
  return { week: raw.week, counts, claimed: bool(raw.claimed, false) };
}

function sanitizeExperiment(raw: unknown): Experiment | null {
  if (!isObj(raw) || !isDay(raw.startDay)) return null;
  if (!(EXPERIMENT_IDS as readonly unknown[]).includes(raw.id)) return null;
  return { id: raw.id as Experiment['id'], startDay: raw.startDay };
}

function sanitizeBudget(raw: unknown): Budget | null {
  if (!isObj(raw) || !isNum(raw.startedAt) || !isDay(raw.startDay)) return null;
  const goal = (BUDGET_GOALS as readonly number[]).includes(raw.goal as number)
    ? (raw.goal as number)
    : BUDGET_GOALS[0];
  return {
    startedAt: raw.startedAt,
    startDay: raw.startDay,
    goal,
    allowance: Math.max(0, num(raw.allowance, 0)),
    needs: Math.max(0, num(raw.needs, 0)),
    wants: Math.max(0, num(raw.wants, 0)),
  };
}

function sanitizeWords(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!isObj(raw)) return out;
  for (const [k, v] of Object.entries(raw))
    if (isNum(v) && k.length <= 40) out[k] = Math.min(WORD_MAX_BOX, Math.max(0, Math.floor(v)));
  return out;
}

function sanitizeMoods(raw: unknown): MoodEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m): m is MoodEntry => isObj(m) && isDay(m.day) && isMood(m.mood))
    .map((m) => ({ day: m.day, mood: m.mood }))
    .slice(-MOOD_DAYS);
}

function sanitizeGame(raw: unknown): GameState {
  const d = createDefaultGame();
  const g = isObj(raw) ? raw : {};
  const inv = isObj(g.inventory) ? g.inventory : {};
  const owned = Array.isArray(inv.owned) ? inv.owned.filter(isItemId) : [];
  const equippedRaw = isObj(inv.equipped) ? inv.equipped : {};
  const equipped: Inventory['equipped'] = {};
  for (const slot of ITEM_SLOTS) {
    const id = equippedRaw[slot];
    if (isItemId(id) && owned.includes(id)) equipped[slot] = id;
  }
  const p = isObj(g.progress) ? g.progress : {};
  const achievements: GameState['achievements'] = {};
  if (isObj(g.achievements)) {
    for (const [k, v] of Object.entries(g.achievements)) if (isNum(v)) achievements[k] = v;
  }
  const bestScores: Progress['bestScores'] = {};
  if (isObj(p.bestScores)) {
    for (const id of MINIGAME_IDS) {
      const v = p.bestScores[id];
      if (isNum(v)) bestScores[id] = v;
    }
  }
  return {
    pet: sanitizePet(g.pet),
    coins: Math.max(0, Math.floor(num(g.coins, d.coins))),
    memorial: Array.isArray(g.memorial)
      ? (g.memorial.filter((m) => isObj(m) && typeof m.name === 'string') as MemorialEntry[])
      : [],
    log: Array.isArray(g.log) ? (g.log.filter((e) => isObj(e) && isNum(e.t)) as LogEntry[]) : [],
    achievements,
    inventory: { owned, equipped },
    progress: {
      hatched: num(p.hatched, 0),
      bestStage: num(p.bestStage, 0),
      starForms: num(p.starForms, 0),
      poopsCleaned: num(p.poopsCleaned, 0),
      cures: num(p.cures, 0),
      gamesPlayed: num(p.gamesPlayed, 0),
      bestScores,
      perfectDays: num(p.perfectDays, 0),
      streak: num(p.streak, 0),
      lastOpenDay: typeof p.lastOpenDay === 'string' ? p.lastOpenDay : null,
      purchases: num(p.purchases, 0),
      factsSeen: sanitizeFacts(p.factsSeen),
      favorites: sanitizeFavorites(p.favorites),
      lastQuizDay: typeof p.lastQuizDay === 'string' ? p.lastQuizDay : null,
      bodyTopics: Array.isArray(p.bodyTopics)
        ? BODY_TOPICS.filter((t) => (p.bodyTopics as unknown[]).includes(t))
        : [],
      casesSolved: num(p.casesSolved, 0),
      casesCorrect: num(p.casesCorrect, 0),
      experimentsDone: num(p.experimentsDone, 0),
      budgetsDone: num(p.budgetsDone, 0),
      budgetGoalsMet: num(p.budgetGoalsMet, 0),
      platesDone: num(p.platesDone, 0),
      words: sanitizeWords(p.words),
      moods: sanitizeMoods(p.moods),
      immersionDay: isDay(p.immersionDay) ? p.immersionDay : null,
    },
    bank: sanitizeBank(g.bank),
    diary: Array.isArray(g.diary)
      ? (
          g.diary.filter(
            (d) => isObj(d) && typeof d.day === 'string' && isObj(d.care),
          ) as DiaryDay[]
        )
          .slice(-DIARY_DAYS)
          .map((d) => ({ ...emptyDay(d.day), ...d }))
      : [],
    plate: sanitizePlate(g.plate),
    experiment: sanitizeExperiment(g.experiment),
    budget: sanitizeBudget(g.budget),
  };
}

export function migrateSave(raw: unknown, fromVersion: number, fallbackLocale: Locale): SaveData {
  if (!isObj(raw) || fromVersion > SCHEMA_VERSION) return createDefaultSave(fallbackLocale);
  let data: Obj = { ...raw };
  for (let v = fromVersion; v < SCHEMA_VERSION; v++) {
    const step = migrations[v];
    if (!step) return createDefaultSave(fallbackLocale);
    data = step(data);
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: sanitizeSettings(data.settings, createDefaultSettings(fallbackLocale)),
    game: sanitizeGame(data.game),
  };
}

// --- Export / import ---------------------------------------------------------

export const EXPORT_FORMAT = 'pocketpals-save';

export function serializeSave(save: SaveData, now: number): string {
  return JSON.stringify({ format: EXPORT_FORMAT, exportedAt: now, ...save });
}

/** Parses an exported file. Returns null if it isn't a Pocket Pals save. */
export function parseSave(text: string, fallbackLocale: Locale): SaveData | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isObj(raw) || raw.format !== EXPORT_FORMAT || !isNum(raw.schemaVersion)) return null;
  if (raw.schemaVersion > SCHEMA_VERSION) return null;
  if (
    raw.game !== undefined &&
    isObj(raw.game) &&
    raw.game.pet != null &&
    !isValidPet(raw.game.pet)
  )
    return null;
  return migrateSave(raw, raw.schemaVersion, fallbackLocale);
}
