import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AchievementId } from '../game/achievements';
import * as A from '../game/actions';
import type { ActionOutcome, ActionResult } from '../game/actions';
import { debugForceSick, debugSetStat, debugSkipStage } from '../game/debug';
import {
  act,
  buyItem,
  finishMinigame,
  killNow,
  recordOpen,
  startEgg,
  tick,
  toggleEquip,
  type GameUpdate,
} from '../game/game';
import { randomSeed } from '../game/rng';
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

interface Transient {
  summary: AwaySummary | null;
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
        set((s) => ({
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
          commit(
            { ...res, unlocked: [...opened.unlocked, ...res.unlocked] },
            summary ? { summary } : {},
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
          const res = act(game, now(), opts(), ACTIONS[action]);
          const kind = res.outcome ? REACTION_FOR[action]?.[res.outcome] : undefined;
          commit(res, {
            ...(kind ? { reaction: { kind, id: ++reactionId } } : {}),
            ...(res.outcome
              ? { feedback: { action, outcome: res.outcome, id: ++feedbackId } }
              : {}),
          });
          return res.outcome;
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
