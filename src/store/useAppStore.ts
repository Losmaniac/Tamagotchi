import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AchievementId } from '../game/achievements';
import * as A from '../game/actions';
import type { ActionOutcome, ActionResult } from '../game/actions';
import { debugForceSick, debugSetStat, debugSkipStage } from '../game/debug';
import {
  act,
  buyItem,
  bankDeposit,
  bankWithdraw,
  feedSnackFood,
  finishMinigame,
  finishQuiz,
  killNow,
  learnFact,
  recordOpen,
  startEgg,
  tick,
  toggleEquip,
  type GameUpdate,
} from '../game/game';
import { WELCOME_BACK_AWAY } from '../game/constants';
import type { CareKind } from '../game/diary';
import type { SnackId } from '../game/food';
import { randomSeed } from '../game/rng';
import type { PhraseKey } from '../i18n/vocab';
import {
  SCHEMA_VERSION,
  STORAGE_KEY,
  createDefaultGame,
  createDefaultSave,
  migrateSave,
  parseSave,
  serializeSave,
  type Locale,
  type MinigameId,
  type SaveData,
  type Settings,
} from '../game/save';
import type { BuyOutcome } from '../game/game';
import type { ItemId } from '../game/shop';
import type { SimOptions } from '../game/simulation';
import { isSummaryWorthShowing, type AwaySummary } from '../game/summary';
import type { ColorVariant, Pet, SimEvent, Species, StatKey } from '../game/types';
import { detectLocale } from '../i18n/translate';
import type { Reaction, ReactionKind } from '../three/anim';
import { safeStorage } from './safeStorage';

export type PetAction =
  | 'meal'
  | 'snack'
  | 'toy'
  | 'stroke'
  | 'poke'
  | 'clean'
  | 'lights'
  | 'medicine'
  | 'scold'
  | 'wake'
  | 'warm';

const ACTIONS: Record<Exclude<PetAction, 'poke'>, (pet: Pet, now: number) => ActionResult> = {
  meal: A.feedMeal,
  snack: A.feedSnack,
  toy: A.play,
  stroke: A.stroke,
  clean: A.clean,
  lights: A.toggleLights,
  medicine: A.giveMedicine,
  scold: A.scold,
  wake: A.wake,
  warm: A.warmEgg,
};

export interface Feedback {
  action: PetAction | 'buy';
  outcome: ActionOutcome | BuyOutcome;
  id: number;
  detail?: string;
}

export type JoyKind = 'welcome' | 'birthday' | 'perfectDay' | 'wellRested';
export interface Joy {
  kind: JoyKind;
  id: number;
  /** Birthday: age in days. */
  days?: number;
}
export interface Speech {
  phrase: PhraseKey;
  id: number;
}

interface Transient {
  summary: AwaySummary | null;
  joy: Joy | null;
  speech: Speech | null;
  achievementQueue: AchievementId[];
  reaction: Reaction | null;
  feedback: Feedback | null;
  /** Debug clock: game time = real time + offset; scale > 1 fast-forwards. */
  debugOffset: number;
  debugTimeScale: number;
}

interface Actions {
  now: () => number;
  setLocale: (locale: Locale) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  createEgg: (species: Species, color: ColorVariant, name: string) => void;
  /** Live tick while the app is open. */
  tick: () => void;
  /** App opened / became visible: catch up and maybe show the away summary. */
  resume: () => void;
  perform: (action: PetAction) => ActionOutcome | null;
  feedSnack: (food: SnackId) => ActionOutcome | null;
  bankDeposit: (amount: number) => void;
  bankWithdraw: (amount: number) => void;
  learnFact: (species: Species, index: number) => void;
  finishQuiz: (correct: number) => number;
  playMinigame: (id: MinigameId, score: number) => { coins: number; ok: boolean };
  buy: (id: ItemId) => BuyOutcome;
  toggleItem: (id: ItemId) => void;
  dismissSummary: () => void;
  shiftAchievement: () => void;
  /** After the death scene: clear the pet so a new egg can be chosen. */
  clearDeadPet: () => void;
  exportSave: () => string;
  importSave: (text: string) => boolean;
  resetGame: () => void;
  debug: {
    setTimeScale: (scale: number) => void;
    setStat: (key: StatKey, value: number) => void;
    forceSick: () => void;
    skipStage: () => void;
    kill: () => void;
  };
}

export type AppState = SaveData & Transient & Actions;

const browserLocale = (): Locale =>
  detectLocale(typeof navigator === 'undefined' ? undefined : navigator.languages);

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const REACTION_FOR: Partial<Record<PetAction, Partial<Record<ActionOutcome, ReactionKind>>>> = {
  meal: { ok: 'eat', refused: 'refuse', full: 'refuse' },
  snack: { ok: 'snack', gotSick: 'snack' },
  toy: { ok: 'play' },
  stroke: { ok: 'stroke' },
  clean: { ok: 'clean' },
  medicine: { ok: 'medicine', cured: 'medicine', notSick: 'refuse' },
  scold: { ok: 'scold', unfair: 'scold' },
  warm: { ok: 'poke' },
  wake: { ok: 'poke' },
};

let reactionId = 0;
let feedbackId = 0;
let joyId = 0;
let speechId = 0;

const CARE_FOR: Partial<Record<PetAction, CareKind>> = {
  meal: 'meal',
  snack: 'snack',
  toy: 'play',
  clean: 'clean',
  medicine: 'medicine',
  stroke: 'stroke',
  scold: 'scold',
};

/** A short phrase the pet says (shown in bilingual mode). */
function speechFor(action: PetAction, outcome: ActionOutcome, lightsOn: boolean): PhraseKey | null {
  if (outcome === 'notSick' || outcome === 'refused') return 'yuck';
  if (outcome !== 'ok' && outcome !== 'cured') return null;
  switch (action) {
    case 'meal':
    case 'snack':
      return 'yummy';
    case 'stroke':
      return 'love';
    case 'toy':
      return 'fun';
    case 'clean':
      return 'clean';
    case 'medicine':
      return 'thanks';
    case 'lights':
      return lightsOn ? null : 'goodNight';
    case 'wake':
      return 'goodMorning';
    default:
      return null;
  }
}

function joyForEvents(events: SimEvent[]): Joy | null {
  const b = events.find((e) => e.type === 'birthday');
  if (b && b.type === 'birthday') return { kind: 'birthday', days: b.days, id: ++joyId };
  if (events.some((e) => e.type === 'perfectDay')) return { kind: 'perfectDay', id: ++joyId };
  if (events.some((e) => e.type === 'wellRested')) return { kind: 'wellRested', id: ++joyId };
  return null;
}

function reactionForEvents(events: SimEvent[]): Reaction | null {
  if (events.some((e) => e.type === 'hatched' || e.type === 'evolved'))
    return { kind: 'evolve', id: ++reactionId };
  return null;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      const opts = (): SimOptions => ({ bedtime: get().settings.bedtime });

      /** Applies a game update and queues achievements / evolution reactions. */
      const commit = (u: GameUpdate, extra: Partial<AppState> = {}) => {
        const evolve = reactionForEvents(u.events);
        const joy = joyForEvents(u.events);
        set((s) => ({
          ...(joy ? { joy, reaction: { kind: 'hop' as const, id: ++reactionId } } : {}),
          game: u.game,
          achievementQueue: u.unlocked.length
            ? [...s.achievementQueue, ...u.unlocked]
            : s.achievementQueue,
          ...(evolve ? { reaction: evolve } : {}),
          ...extra,
        }));
      };

      return {
        ...createDefaultSave(browserLocale()),
        summary: null,
        joy: null,
        speech: null,
        achievementQueue: [],
        reaction: null,
        feedback: null,
        debugOffset: 0,
        debugTimeScale: 1,

        now: () => Date.now() + get().debugOffset,

        setLocale: (locale) => set((s) => ({ settings: { ...s.settings, locale } })),
        updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

        createEgg: (species, color, name) => {
          const now = get().now();
          set((s) => ({
            game: startEgg(s.game, { id: newId(), name, species, color, now, seed: randomSeed() }),
            summary: null,
          }));
        },

        tick: () => {
          const { game, now } = get();
          if (!game.pet || game.pet.dead) return;
          commit(tick(game, now(), opts()));
        },

        resume: () => {
          const now = get().now();
          const opened = recordOpen(get().game, now);
          const res = tick(opened.game, now, opts());
          const summary = res.summary && isSummaryWorthShowing(res.summary) ? res.summary : null;
          const pet = res.game.pet;
          const welcome =
            summary !== null &&
            summary.to - summary.from >= WELCOME_BACK_AWAY &&
            pet !== null &&
            !pet.dead &&
            !pet.asleep &&
            !pet.sick &&
            pet.stage !== 'egg';
          commit(
            { ...res, unlocked: [...opened.unlocked, ...res.unlocked] },
            {
              ...(summary ? { summary } : {}),
              ...(welcome
                ? {
                    joy: { kind: 'welcome', id: ++joyId },
                    reaction: { kind: 'play', id: ++reactionId },
                    speech: { phrase: 'missedYou', id: ++speechId },
                  }
                : {}),
            },
          );
        },

        perform: (action) => {
          const { game, now } = get();
          if (!game.pet) return null;
          if (action === 'poke') {
            if (!game.pet.dead && !game.pet.asleep)
              set({ reaction: { kind: 'poke', id: ++reactionId } });
            return 'ok';
          }
          const res = act(game, now(), opts(), ACTIONS[action], CARE_FOR[action]);
          const kind = res.outcome ? REACTION_FOR[action]?.[res.outcome] : undefined;
          const phrase = res.outcome
            ? speechFor(action, res.outcome, res.game.pet?.lightsOn ?? true)
            : null;
          commit(res, {
            ...(kind ? { reaction: { kind, id: ++reactionId } } : {}),
            ...(phrase ? { speech: { phrase, id: ++speechId } } : {}),
            ...(res.outcome
              ? { feedback: { action, outcome: res.outcome, id: ++feedbackId } }
              : {}),
          });
          return res.outcome;
        },

        feedSnack: (food) => {
          const { game, now } = get();
          if (!game.pet) return null;
          const res = feedSnackFood(game, now(), opts(), food);
          const ok =
            res.outcome === 'ok' || res.outcome === 'favorite' || res.outcome === 'gotSick';
          commit(res, {
            ...(ok ? { reaction: { kind: 'snack', id: ++reactionId } } : {}),
            ...(res.outcome === 'ok' || res.outcome === 'favorite'
              ? {
                  speech: {
                    phrase: res.outcome === 'favorite' ? 'favorite' : 'yummy',
                    id: ++speechId,
                  },
                }
              : {}),
            ...(res.outcome
              ? { feedback: { action: 'snack', outcome: res.outcome, id: ++feedbackId } }
              : {}),
          });
          return res.outcome;
        },

        bankDeposit: (amount) => set((s) => ({ game: bankDeposit(s.game, amount, get().now()) })),
        bankWithdraw: (amount) => set((s) => ({ game: bankWithdraw(s.game, amount, get().now()) })),
        learnFact: (species, index) => set((s) => ({ game: learnFact(s.game, species, index) })),
        finishQuiz: (correct) => {
          const res = finishQuiz(get().game, get().now(), correct);
          set({ game: res.game });
          return res.coins;
        },

        playMinigame: (id, score) => {
          const res = finishMinigame(get().game, get().now(), opts(), id, score);
          commit(res, res.coins > 0 ? { reaction: { kind: 'hop', id: ++reactionId } } : {});
          return { coins: res.coins, ok: res.coins > 0 };
        },

        buy: (id) => {
          const res = buyItem(get().game, id, get().now());
          set((s) => ({
            game: res.game,
            achievementQueue: [...s.achievementQueue, ...res.unlocked],
            feedback: { action: 'buy', outcome: res.outcome, id: ++feedbackId, detail: id },
          }));
          return res.outcome;
        },

        toggleItem: (id) => {
          const res = toggleEquip(get().game, id, get().now());
          set((s) => ({
            game: res.game,
            achievementQueue: [...s.achievementQueue, ...res.unlocked],
          }));
        },

        dismissSummary: () => set({ summary: null }),
        shiftAchievement: () => set((s) => ({ achievementQueue: s.achievementQueue.slice(1) })),
        clearDeadPet: () => set((s) => ({ game: { ...s.game, pet: null }, summary: null })),

        exportSave: () => {
          const { schemaVersion, settings, game } = get();
          return serializeSave({ schemaVersion, settings, game }, Date.now());
        },

        importSave: (text) => {
          const save = parseSave(text, get().settings.locale);
          if (!save) return false;
          set({ ...save, summary: null, achievementQueue: [], reaction: null });
          get().resume();
          return true;
        },

        resetGame: () =>
          set((s) => ({
            game: createDefaultGame(),
            settings: { ...s.settings },
            summary: null,
            achievementQueue: [],
            reaction: null,
            feedback: null,
            debugOffset: 0,
            debugTimeScale: 1,
          })),

        debug: {
          setTimeScale: (scale) => set({ debugTimeScale: scale }),
          setStat: (key, value) => {
            const pet = get().game.pet;
            if (pet) set((s) => ({ game: { ...s.game, pet: debugSetStat(pet, key, value) } }));
          },
          forceSick: () => {
            const pet = get().game.pet;
            if (pet) set((s) => ({ game: { ...s.game, pet: debugForceSick(pet, get().now()) } }));
          },
          skipStage: () => {
            const pet = get().game.pet;
            if (!pet) return;
            set((s) => ({ game: { ...s.game, pet: debugSkipStage(pet, get().now()) } }));
            get().tick();
          },
          kill: () => commit(killNow(get().game, get().now())),
        },
      };
    },
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => safeStorage),
      partialize: ({ schemaVersion, settings, game }): SaveData => ({
        schemaVersion,
        settings,
        game,
      }),
      migrate: (persisted, version) => migrateSave(persisted, version, browserLocale()),
      // Always sanitise what comes out of storage, even at the current version.
      merge: (persisted, current) => {
        const save = migrateSave(persisted, SCHEMA_VERSION, current.settings.locale);
        return persisted ? { ...current, ...save } : current;
      },
    },
  ),
);
