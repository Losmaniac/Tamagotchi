// Game-level reducers: wrap the pet simulation with wallet, log, memorial,
// progress and achievements. Pure: every function returns a new GameState.

import { unlockAchievements, type AchievementId } from './achievements';
import { coinsForMinigame, feedSnack, rewardMinigame, type ActionResult } from './actions';
import { accrueInterest, deposit, withdraw } from './bank';
import { diaryDay, sampleStats, type CareKind } from './diary';
import { hasSeen, markSeen } from './facts';
import type { SnackId } from './food';
import {
  BIRTHDAY_COINS,
  HOUR,
  LOG_LIMIT,
  MEMORIAL_LIMIT,
  QUIZ_COINS_PER_CORRECT,
} from './constants';
import { killPet, toMemorial } from './death';
import { createEgg, type NewEggOptions } from './pet';
import type { GameState, MinigameId } from './save';
import { getItem, type ItemId } from './shop';
import { advance, type SimOptions } from './simulation';
import { summarize, type AwaySummary } from './summary';
import { STAGES, type LogEntry, type Pet, type SimEvent, type Species } from './types';

export interface GameUpdate {
  game: GameState;
  events: SimEvent[];
  unlocked: AchievementId[];
}

function cloneGame(game: GameState): GameState {
  return structuredClone(game);
}

const LOGGED: ReadonlySet<SimEvent['type']> = new Set([
  'hatched',
  'evolved',
  'poop',
  'sick',
  'cured',
  'fellAsleep',
  'wokeUp',
  'careMistake',
  'actedUp',
  'died',
  'coins',
]);

function toLogEntry(e: SimEvent): LogEntry | null {
  if (!LOGGED.has(e.type)) return null;
  switch (e.type) {
    case 'evolved':
      return { t: e.t, type: 'evolved', value: `${e.stage}:${e.form}` };
    case 'died':
      return { t: e.t, type: 'died', value: e.cause };
    case 'coins':
      return { t: e.t, type: 'coins', value: e.amount };
    case 'careMistake':
      return { t: e.t, type: 'careMistake', value: e.call };
    default:
      return { t: e.t, type: e.type as LogEntry['type'] };
  }
}

/** Applies simulation events to wallet/log/progress/memorial. Mutates `game`. */
function absorbEvents(game: GameState, pet: Pet, events: SimEvent[]): void {
  for (const e of events) {
    const entry = toLogEntry(e);
    if (entry) game.log.push(entry);
    switch (e.type) {
      case 'hatched':
        game.progress.hatched += 1;
        game.progress.bestStage = Math.max(game.progress.bestStage, STAGES.indexOf('baby'));
        break;
      case 'evolved':
        game.progress.bestStage = Math.max(game.progress.bestStage, STAGES.indexOf(e.stage));
        if (e.form === 'star') game.progress.starForms += 1;
        break;
      case 'coins':
        game.coins += e.amount;
        break;
      case 'perfectDay':
        game.progress.perfectDays += 1;
        break;
      case 'birthday':
        game.coins += BIRTHDAY_COINS[e.days] ?? 0;
        break;
      case 'wellRested':
        diaryDay(game.diary, localDayKey(e.t)).wellRested = true;
        break;
      case 'careMistake':
        diaryDay(game.diary, localDayKey(e.t)).missedCalls += 1;
        break;
      case 'sick':
        diaryDay(game.diary, localDayKey(e.t)).sick = true;
        break;
      case 'cured':
        game.progress.cures += 1;
        break;
      case 'died': {
        const entry = toMemorial(pet);
        if (entry && !game.memorial.some((m) => m.id === entry.id)) {
          game.memorial = [entry, ...game.memorial].slice(0, MEMORIAL_LIMIT);
        }
        break;
      }
    }
  }
  if (game.log.length > LOG_LIMIT) game.log = game.log.slice(-LOG_LIMIT);
}

function finish(game: GameState, events: SimEvent[], now: number): GameUpdate {
  return { game, events, unlocked: unlockAchievements(game, now) };
}

/** Advances the pet to `now` (live tick or offline catch-up). */
export function tick(
  input: GameState,
  now: number,
  opts: SimOptions,
): GameUpdate & { summary: AwaySummary | null } {
  const before = input.pet;
  if (!before) return { ...finish(cloneGame(input), [], now), summary: null };
  const from = before.lastTickAt;
  const result = advance(before, now, opts);
  const game = cloneGame(input);
  game.pet = result.pet;
  absorbEvents(game, result.pet, result.events);
  accrueInterest(game.bank, now);
  if (!result.pet.dead && result.pet.stage !== 'egg')
    sampleStats(
      diaryDay(game.diary, localDayKey(now)),
      result.pet.stats,
      Math.max(0, now - from) / HOUR,
    );
  const summary = summarize(before, result.pet, result.events, from, now, result.coins);
  return { ...finish(game, result.events, now), summary };
}

/**
 * Advances to `now`, then applies a pet action.
 * Returns the action outcome so the UI can react (e.g. "refused", "asleep").
 */
export function act(
  input: GameState,
  now: number,
  opts: SimOptions,
  action: (pet: Pet, now: number) => ActionResult,
  care?: CareKind,
): GameUpdate & { outcome: ActionResult['outcome'] | null } {
  const ticked = tick(input, now, opts);
  const game = ticked.game;
  if (!game.pet) return { ...ticked, outcome: null };
  const poopsBefore = game.pet.poops;
  const result = action(game.pet, now);
  game.pet = result.pet;
  if (result.outcome === 'ok' && result.pet.poops < poopsBefore) {
    game.progress.poopsCleaned += poopsBefore - result.pet.poops;
  }
  absorbEvents(game, result.pet, result.events);
  const okOutcomes: ActionResult['outcome'][] = ['ok', 'favorite', 'gotSick', 'cured'];
  if (care && okOutcomes.includes(result.outcome)) {
    const rec = diaryDay(game.diary, localDayKey(now));
    rec.care[care] = (rec.care[care] ?? 0) + 1;
  }
  const events = [...ticked.events, ...result.events];
  const unlocked = [...ticked.unlocked, ...unlockAchievements(game, now)];
  return { game, events, unlocked, outcome: result.outcome };
}

/** Debug: the pet dies right now (recorded in the memorial like any death). */
export function killNow(input: GameState, now: number): GameUpdate {
  const game = cloneGame(input);
  const pet = game.pet;
  if (!pet || pet.dead) return finish(game, [], now);
  killPet(pet, now, 'sickness');
  const events: SimEvent[] = [{ type: 'died', t: now, cause: 'sickness' }];
  absorbEvents(game, pet, events);
  return finish(game, events, now);
}

export function startEgg(input: GameState, opts: NewEggOptions): GameState {
  const game = cloneGame(input);
  // The very first pet gets a gentle start.
  const beginner = game.progress.hatched === 0 && game.memorial.length === 0;
  game.pet = createEgg({ beginner, ...opts });
  return game;
}

/** Feeds a chosen snack; trying a species' favourite discovers it. */
export function feedSnackFood(input: GameState, now: number, opts: SimOptions, food: SnackId) {
  const res = act(input, now, opts, (pet, t) => feedSnack(pet, t, food), 'snack');
  const pet = res.game.pet;
  if (pet && res.outcome === 'favorite') res.game.progress.favorites[pet.species] = food;
  return res;
}

export function bankDeposit(input: GameState, amount: number, now: number): GameState {
  const coins = Math.min(Math.floor(amount), input.coins);
  if (coins <= 0) return input;
  const game = cloneGame(input);
  game.coins -= coins;
  deposit(game.bank, coins, now);
  return game;
}

export function bankWithdraw(input: GameState, amount: number, now: number): GameState {
  const game = cloneGame(input);
  game.coins += withdraw(game.bank, Math.floor(amount), now);
  return game;
}

/** The pet told today's fact: add it to the encyclopedia. */
export function learnFact(input: GameState, species: Species, index: number): GameState {
  if (hasSeen(input.progress.factsSeen, species, index)) return input;
  const game = cloneGame(input);
  game.progress.factsSeen = markSeen(game.progress.factsSeen, species, index);
  return game;
}

export function canQuizToday(game: GameState, now: number): boolean {
  return game.progress.lastQuizDay !== localDayKey(now);
}

/** Pays the daily quiz reward (once per day). Returns coins earned. */
export function finishQuiz(
  input: GameState,
  now: number,
  correct: number,
): { game: GameState; coins: number } {
  if (!canQuizToday(input, now)) return { game: input, coins: 0 };
  const game = cloneGame(input);
  const coins = Math.max(0, correct) * QUIZ_COINS_PER_CORRECT;
  game.coins += coins;
  game.progress.lastQuizDay = localDayKey(now);
  return { game, coins };
}

/** Records a finished mini-game: rewards the pet and pays coins. */
export function finishMinigame(
  input: GameState,
  now: number,
  opts: SimOptions,
  id: MinigameId,
  score: number,
): GameUpdate & { coins: number } {
  const res = act(input, now, opts, (pet, t) => rewardMinigame(pet, t, score));
  const game = res.game;
  const coins = res.outcome === 'ok' ? coinsForMinigame(score) : 0;
  game.coins += coins;
  game.progress.gamesPlayed += 1;
  game.progress.bestScores[id] = Math.max(game.progress.bestScores[id] ?? 0, score);
  return { ...res, unlocked: [...res.unlocked, ...unlockAchievements(game, now)], coins };
}

export type BuyOutcome = 'ok' | 'owned' | 'poor' | 'unknown';

export function buyItem(
  input: GameState,
  id: ItemId,
  now: number,
): { game: GameState; outcome: BuyOutcome; unlocked: AchievementId[] } {
  const item = getItem(id);
  if (!item) return { game: input, outcome: 'unknown', unlocked: [] };
  if (input.inventory.owned.includes(id)) return { game: input, outcome: 'owned', unlocked: [] };
  if (input.coins < item.price) return { game: input, outcome: 'poor', unlocked: [] };
  const game = cloneGame(input);
  game.coins -= item.price;
  game.inventory.owned.push(id);
  game.inventory.equipped[item.slot] = id;
  game.progress.purchases += 1;
  return { game, outcome: 'ok', unlocked: unlockAchievements(game, now) };
}

/** Equips an owned item, or unequips it if it is already worn. */
export function toggleEquip(
  input: GameState,
  id: ItemId,
  now: number,
): { game: GameState; unlocked: AchievementId[] } {
  const item = getItem(id);
  if (!item || !input.inventory.owned.includes(id)) return { game: input, unlocked: [] };
  const game = cloneGame(input);
  if (game.inventory.equipped[item.slot] === id) delete game.inventory.equipped[item.slot];
  else game.inventory.equipped[item.slot] = id;
  return { game, unlocked: unlockAchievements(game, now) };
}

export function localDayKey(t: number): string {
  const d = new Date(t);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Daily-open streak bookkeeping. */
export function recordOpen(
  input: GameState,
  now: number,
): { game: GameState; unlocked: AchievementId[] } {
  const today = localDayKey(now);
  if (input.progress.lastOpenDay === today) return { game: input, unlocked: [] };
  const game = cloneGame(input);
  const yesterday = localDayKey(new Date(now).setDate(new Date(now).getDate() - 1));
  game.progress.streak = game.progress.lastOpenDay === yesterday ? game.progress.streak + 1 : 1;
  game.progress.lastOpenDay = today;
  return { game, unlocked: unlockAchievements(game, now) };
}
