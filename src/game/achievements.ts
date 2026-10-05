import { WORD_LEARNED_BOX } from './constants';
import type { GameState } from './save';
import { STAGES } from './types';

export interface Achievement {
  id: string;
  icon: string;
  test: (g: GameState) => boolean;
}

const stageIndex = (s: (typeof STAGES)[number]) => STAGES.indexOf(s);

export const ACHIEVEMENTS = [
  { id: 'firstHatch', icon: '🐣', test: (g) => g.progress.hatched >= 1 },
  { id: 'reachChild', icon: '🧸', test: (g) => g.progress.bestStage >= stageIndex('child') },
  { id: 'reachTeen', icon: '🎧', test: (g) => g.progress.bestStage >= stageIndex('teen') },
  { id: 'reachAdult', icon: '🏆', test: (g) => g.progress.bestStage >= stageIndex('adult') },
  { id: 'starForm', icon: '🌟', test: (g) => g.progress.starForms >= 1 },
  { id: 'fullLife', icon: '🕊️', test: (g) => g.memorial.some((m) => m.cause === 'oldAge') },
  { id: 'streak7', icon: '🔥', test: (g) => g.progress.streak >= 7 },
  { id: 'perfectDay', icon: '💯', test: (g) => g.progress.perfectDays >= 1 },
  { id: 'firstGame', icon: '🎮', test: (g) => g.progress.gamesPlayed >= 1 },
  {
    id: 'highScore',
    icon: '🚀',
    test: (g) => Object.values(g.progress.bestScores).some((s) => (s ?? 0) >= 0.9),
  },
  { id: 'rich', icon: '💰', test: (g) => g.coins >= 200 },
  { id: 'shopper', icon: '🛍️', test: (g) => g.progress.purchases >= 1 },
  {
    id: 'fashionista',
    icon: '🕶️',
    test: (g) =>
      Object.entries(g.inventory.equipped).filter(([slot, id]) => slot !== 'background' && id)
        .length >= 3,
  },
  { id: 'cleanFreak', icon: '🧽', test: (g) => g.progress.poopsCleaned >= 25 },
  { id: 'doctor', icon: '💊', test: (g) => g.progress.cures >= 1 },
  { id: 'disciplined', icon: '📏', test: (g) => (g.pet?.discipline ?? 0) >= 100 },
  { id: 'detective', icon: '🔍', test: (g) => g.progress.casesCorrect >= 3 },
  { id: 'scientist', icon: '🧪', test: (g) => g.progress.experimentsDone >= 1 },
  { id: 'budgeter', icon: '💸', test: (g) => g.progress.budgetGoalsMet >= 1 },
  { id: 'balancedPlate', icon: '🥗', test: (g) => g.progress.platesDone >= 1 },
  {
    id: 'polyglot',
    icon: '🗣️',
    test: (g) => Object.values(g.progress.words).filter((b) => b >= WORD_LEARNED_BOX).length >= 50,
  },
] as const satisfies readonly Achievement[];

export type AchievementId = (typeof ACHIEVEMENTS)[number]['id'];

/** Unlocks any newly earned achievements (mutates `game`) and returns their ids. */
export function unlockAchievements(game: GameState, now: number): AchievementId[] {
  const unlocked: AchievementId[] = [];
  for (const a of ACHIEVEMENTS) {
    if (game.achievements[a.id] === undefined && a.test(game)) {
      game.achievements[a.id] = now;
      unlocked.push(a.id);
    }
  }
  return unlocked;
}
