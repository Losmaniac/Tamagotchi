// Persisted save shape, defaults, migrations and import validation. Pure TS.

import { createBank, type Bank } from './bank';
import { BANK_HISTORY_LIMIT, DEFAULT_BEDTIME, DIARY_DAYS, START_COINS } from './constants';
import type { DiaryDay } from './diary';
import type { FactsSeen } from './facts';
import { isSnackId, type SnackId } from './food';
import { isItemId, ITEM_SLOTS, type Inventory } from './shop';
import {
  CARE_STATS,
  COLOR_VARIANTS,
  SPECIES,
  STAGES,
  type Bedtime,
  type LogEntry,
  type MemorialEntry,
  type Pet,
  type Species,
} from './types';

export const SCHEMA_VERSION = 2;
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
    },
    bank: createBank(),
    diary: [],
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
    pet: isValidPet(g.pet) ? g.pet : null,
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
    },
    bank: sanitizeBank(g.bank),
    diary: Array.isArray(g.diary)
      ? (
          g.diary.filter(
            (d) => isObj(d) && typeof d.day === 'string' && isObj(d.care),
          ) as DiaryDay[]
        ).slice(-DIARY_DAYS)
      : [],
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
