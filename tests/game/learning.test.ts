import { describe, expect, it } from 'vitest';
import { feedSnack } from '../../src/game/actions';
import { ACHIEVEMENTS } from '../../src/game/achievements';
import {
  BUDGET_PRICES,
  budgetOver,
  daysLeft,
  remaining,
  settleBudget,
  spend,
  startBudget,
} from '../../src/game/budget';
import {
  BUDGET_ALLOWANCE,
  BUDGET_BONUS,
  DAY,
  DETECTIVE_COINS,
  EXPERIMENT_BONUS_COINS,
  EXPERIMENT_COINS,
  HOUR,
  MINUTE,
  PLATE_COINS,
} from '../../src/game/constants';
import { clueList, hasOpenCase, solveCase } from '../../src/game/detective';
import { average, emptyDay, shiftDay, type DiaryDay } from '../../src/game/diary';
import {
  baselineDays,
  canStartExperiment,
  evaluate,
  experimentCoins,
  isFinished,
  lastTestDay,
  startExperiment,
  testDayNumber,
} from '../../src/game/experiments';
import {
  beginBudget,
  beginExperiment,
  cancelBudget,
  cancelExperiment,
  checkIn,
  claimPlateReward,
  closeBudget,
  concludeExperiment,
  feedSnackFood,
  finishMinigame,
  hasCheckedInToday,
  isImmersionDay,
  localDayKey,
  act,
  recordWords,
  setImmersionDay,
  solveDetectiveCase,
  tick,
} from '../../src/game/game';
import { feedMeal, giveMedicine } from '../../src/game/actions';
import { isMood, recordMood, topicsFromPet, unlockTopics } from '../../src/game/learning';
import {
  NUTRITION,
  claimPlate,
  currentPlate,
  emptyPlate,
  plateComplete,
  plateGoals,
  recordFood,
  treatsOk,
  weekOf,
} from '../../src/game/nutrition';
import { reportCard } from '../../src/game/report';
import {
  SCHEMA_VERSION,
  createDefaultGame,
  migrateSave,
  type GameState,
} from '../../src/game/save';
import { advance } from '../../src/game/simulation';
import { createRng } from '../../src/game/rng';
import { SNACKS } from '../../src/game/food';
import { isLearned, learnedCount, nextBox, pickWords, UNSEEN_BOX } from '../../src/game/words';
import { SPECIES } from '../../src/game/types';
import { WILD } from '../../src/game/wild';
import { MORNING, NO_SLEEP, baby } from './helpers';

const TODAY = localDayKey(MORNING);
const HEALTHY = { hunger: 80, happiness: 80, energy: 100, hygiene: 90, health: 100 };

function day(offset: number, patch: Partial<DiaryDay> = {}): DiaryDay {
  return { ...emptyDay(shiftDay(TODAY, offset)), ...patch };
}

/** A diary day with `hours` of samples at a constant stat value. */
function sampled(offset: number, value: number, patch: Partial<DiaryDay> = {}): DiaryDay {
  return day(offset, {
    hours: 10,
    happiness: value * 10,
    hunger: value * 10,
    energy: value * 10,
    ...patch,
  });
}

function gameWithPet(overrides: Parameters<typeof baby>[2] = {}): GameState {
  return { ...createDefaultGame(), pet: baby(MORNING, 1, overrides) };
}

describe('sickness causes and detective mode', () => {
  it('records the cause and clues when the pet gets sick from dirt', () => {
    let pet = baby(MORNING, 7, {
      stats: { hunger: 90, happiness: 90, energy: 90, hygiene: 5, health: 100 },
    });
    let t = MORNING;
    while (!pet.sick && t < MORNING + 10 * DAY) {
      t += HOUR;
      pet = advance({ ...pet, stats: { ...pet.stats, hygiene: 5, hunger: 90 } }, t, NO_SLEEP).pet;
    }
    expect(pet.sick).toBe(true);
    expect(pet.sickCause).toBe('dirty');
    expect(pet.sickClues!.hygiene).toBeLessThan(25);
    expect(pet.caseSolved).toBe(false);
    expect(hasOpenCase(pet)).toBe(true);
    const suspicious = clueList(pet.sickClues!)
      .filter((c) => c.suspicious)
      .map((c) => c.key);
    expect(suspicious).toContain('hygiene');
  });

  it('blames hunger when food is the problem', () => {
    let pet = baby(MORNING, 3);
    let t = MORNING;
    while (!pet.sick && t < MORNING + 10 * DAY) {
      t += HOUR;
      pet = advance({ ...pet, stats: { ...pet.stats, hygiene: 90, hunger: 5 } }, t, NO_SLEEP).pet;
    }
    expect(pet.sickCause).toBe('hungry');
  });

  it('blames snacks when overfeeding makes the pet sick', () => {
    let pet = baby(MORNING, 1, {
      stats: { hunger: 10, happiness: 50, energy: 90, hygiene: 90, health: 100 },
    });
    for (let i = 0; i < 12 && !pet.sick; i++)
      pet = feedSnack(pet, MORNING + i * MINUTE, 'apple').pet;
    expect(pet.sick).toBe(true);
    expect(pet.sickCause).toBe('overfed');
    expect(pet.sickClues!.snacks).toBeGreaterThan(4);
  });

  it('pays coins once for a correct guess and closes the case', () => {
    const pet = baby(MORNING, 1, {
      sick: true,
      sickCause: 'dirty',
      sickClues: { hygiene: 10, hunger: 80, energy: 60, poops: 3, snacks: 0 },
      caseSolved: false,
    });
    expect(solveCase(pet, 'hungry')!.correct).toBe(false);
    const g = { ...createDefaultGame(), pet };
    const res = solveDetectiveCase(g, 'dirty', MORNING)!;
    expect(res.correct).toBe(true);
    expect(res.coins).toBe(DETECTIVE_COINS);
    expect(res.game.coins).toBe(g.coins + DETECTIVE_COINS);
    expect(res.game.progress.casesCorrect).toBe(1);
    expect(res.game.pet!.caseSolved).toBe(true);
    expect(solveDetectiveCase(res.game, 'dirty', MORNING)).toBeNull();
    expect(solveCase(baby(), 'bug')).toBeNull();
  });

  it('a wrong guess still closes the case without coins', () => {
    const g = gameWithPet({
      sick: true,
      sickCause: 'bug',
      sickClues: { hygiene: 80, hunger: 80, energy: 60, poops: 0, snacks: 0 },
      caseSolved: false,
    });
    const res = solveDetectiveCase(g, 'overfed', MORNING)!;
    expect(res.correct).toBe(false);
    expect(res.answer).toBe('bug');
    expect(res.game.progress.casesSolved).toBe(1);
    expect(res.game.progress.casesCorrect).toBe(0);
    expect(res.game.coins).toBe(g.coins);
  });
});

describe('call response times', () => {
  it('records answered calls and how long they waited in the diary', () => {
    const g = gameWithPet({
      stats: { hunger: 10, happiness: 80, energy: 80, hygiene: 80, health: 100 },
    });
    const t1 = tick(g, MORNING + MINUTE, NO_SLEEP).game;
    expect(t1.pet!.calls.hunger).toBeDefined();
    const fed = act(t1, MORNING + 11 * MINUTE, NO_SLEEP, feedMeal, 'meal').game;
    const after = tick(fed, MORNING + 12 * MINUTE, NO_SLEEP).game;
    const rec = after.diary.find((d) => d.day === TODAY)!;
    expect(rec.answered).toBe(1);
    expect(rec.responseMin).toBeGreaterThanOrEqual(10);
    expect(rec.responseMin).toBeLessThanOrEqual(12);
  });
});

describe('body book', () => {
  it('unlocks pages from needs, sickness and medicine', () => {
    const pet = baby(MORNING, 1, {
      sick: true,
      calls: {
        hunger: { since: MORNING, missed: false },
        lights: { since: MORNING, missed: false },
      },
    });
    expect(topicsFromPet(pet).sort()).toEqual(['food', 'germs', 'sleep']);
    expect(unlockTopics(['sleep'], ['food', 'sleep'])).toEqual(['food', 'sleep']);
    const same = ['food' as const];
    expect(unlockTopics(same, ['food'])).toBe(same);

    const g = gameWithPet({
      stats: { hunger: 10, happiness: 80, energy: 80, hygiene: 80, health: 100 },
    });
    const ticked = tick(g, MORNING + MINUTE, NO_SLEEP).game;
    expect(ticked.progress.bodyTopics).toContain('food');
    const sick = { ...ticked, pet: { ...ticked.pet!, sick: true, medicineDosesLeft: 2 } };
    const healed = act(sick, MORNING + 2 * MINUTE, NO_SLEEP, giveMedicine, 'medicine').game;
    expect(healed.progress.bodyTopics).toContain('medicine');
  });
});

describe('food lab and balanced plate', () => {
  it('has nutrition for every snack and the meal', () => {
    for (const s of SNACKS) expect(NUTRITION[s.id]).toBeDefined();
    expect(NUTRITION.cookie.group).toBe('treat');
    expect(NUTRITION.meal.group).toBe('meal');
  });

  it('weeks start on Monday', () => {
    expect(weekOf('2026-01-05')).toBe('2026-01-05'); // Monday
    expect(weekOf('2026-01-11')).toBe('2026-01-05'); // Sunday
    expect(weekOf('2026-01-12')).toBe('2026-01-12');
  });

  it('completes with enough variety and few treats, and pays once', () => {
    let plate = emptyPlate(weekOf(TODAY));
    for (const f of ['apple', 'berries', 'carrot', 'lettuce', 'fish', 'cricket'] as const)
      plate = recordFood(plate, TODAY, f);
    expect(plateComplete(plate)).toBe(false);
    for (let i = 0; i < 5; i++) plate = recordFood(plate, TODAY, 'meal');
    expect(plateGoals(plate).every((g) => g.done)).toBe(true);
    expect(plateComplete(plate)).toBe(true);
    for (let i = 0; i < 5; i++) plate = recordFood(plate, TODAY, 'cookie');
    expect(treatsOk(plate)).toBe(false);
    expect(claimPlate(plate).coins).toBe(0);
  });

  it('a new week starts with an empty plate', () => {
    const plate = recordFood(null, TODAY, 'apple');
    expect(currentPlate(plate, TODAY).counts.fruit).toBe(1);
    expect(currentPlate(plate, shiftDay(TODAY, 7)).counts.fruit).toBe(0);
  });

  it('feeding fills the plate and the reward can be claimed in game', () => {
    let g = gameWithPet({
      stats: { hunger: 0, happiness: 50, energy: 90, hygiene: 90, health: 100 },
    });
    let t = MORNING;
    const feed = (food: Parameters<typeof feedSnackFood>[3]) => {
      t += 3 * HOUR; // avoid overfeeding
      g = feedSnackFood(g, t, NO_SLEEP, food).game;
      g = {
        ...g,
        pet: { ...g.pet!, asleep: false, poops: 0, stats: { ...HEALTHY, hunger: 40 } },
      };
    };
    for (const f of ['apple', 'berries', 'carrot', 'lettuce', 'fish', 'cricket'] as const) feed(f);
    for (let i = 0; i < 5; i++) {
      t += HOUR;
      g = act(g, t, NO_SLEEP, feedMeal, 'meal').game;
      g = {
        ...g,
        pet: { ...g.pet!, asleep: false, poops: 0, stats: { ...HEALTHY, hunger: 40 } },
      };
    }
    expect(plateComplete(currentPlate(g.plate, localDayKey(t)))).toBe(true);
    const res = claimPlateReward(g, t)!;
    expect(res.coins).toBe(PLATE_COINS);
    expect(res.game.progress.platesDone).toBe(1);
    expect(claimPlateReward(res.game, t)).toBeNull();
  });
});

describe('experiments', () => {
  const diaryBefore = [
    sampled(-2, 50, { care: { play: 1 } }),
    sampled(-1, 50, { care: { play: 1 } }),
  ];

  it('needs a baseline day before starting', () => {
    expect(canStartExperiment([], TODAY)).toBe(false);
    expect(canStartExperiment(diaryBefore, TODAY)).toBe(true);
    expect(baselineDays(diaryBefore, TODAY)).toHaveLength(2);
  });

  it('tracks test days and finishes after 3 days', () => {
    const exp = startExperiment('play', TODAY);
    expect(lastTestDay(exp)).toBe(shiftDay(TODAY, 2));
    expect(testDayNumber(exp, TODAY)).toBe(1);
    expect(testDayNumber(exp, shiftDay(TODAY, 2))).toBe(3);
    expect(isFinished(exp, shiftDay(TODAY, 2))).toBe(false);
    expect(isFinished(exp, shiftDay(TODAY, 3))).toBe(true);
  });

  it('concludes supported, not supported, unclear or unfair from the data', () => {
    const exp = startExperiment('play', TODAY);
    const test = (value: number, play: number) =>
      [0, 1, 2].map((o) => sampled(o, value, { care: { play } }));
    expect(evaluate(exp, [...diaryBefore, ...test(70, 4)]).expected).toBe('supported');
    expect(evaluate(exp, [...diaryBefore, ...test(30, 4)]).expected).toBe('notSupported');
    expect(evaluate(exp, [...diaryBefore, ...test(52, 4)]).expected).toBe('unclear');
    expect(evaluate(exp, [...diaryBefore, ...test(80, 1)]).expected).toBe('unfair');
    expect(evaluate(exp, diaryBefore).expected).toBe('unfair');
    expect(experimentCoins('supported', 'supported')).toBe(
      EXPERIMENT_COINS + EXPERIMENT_BONUS_COINS,
    );
    expect(experimentCoins('supported', 'unclear')).toBe(EXPERIMENT_COINS);
  });

  it('runs through the game reducers', () => {
    const g = { ...gameWithPet(), diary: diaryBefore };
    const started = beginExperiment(g, 'sleep', MORNING);
    expect(started.experiment!.id).toBe('sleep');
    expect(beginExperiment(started, 'play', MORNING)).toBe(started);
    expect(concludeExperiment(started, 'unclear', MORNING)).toBeNull();
    expect(cancelExperiment(started).experiment).toBeNull();
    const later = MORNING + 3 * DAY;
    const res = concludeExperiment(started, 'unfair', later)!;
    expect(res.expected).toBe('unfair');
    expect(res.coins).toBe(EXPERIMENT_COINS + EXPERIMENT_BONUS_COINS);
    expect(res.game.experiment).toBeNull();
    expect(res.game.progress.experimentsDone).toBe(1);
    expect(res.unlocked).toContain('scientist');
  });

  it('averages diary stats by hours', () => {
    expect(average([], 'energy')).toBeNull();
    expect(average([sampled(0, 40), sampled(1, 60)], 'energy')).toBe(50);
  });
});

describe('budget week', () => {
  it('spends on needs and wants until the week is over', () => {
    let b = startBudget(MORNING, TODAY, 20);
    b = spend(b, 'meal', MORNING);
    b = spend(b, 'sweetSnack', MORNING);
    b = spend(b, 'stroke', MORNING); // free
    expect(b.needs).toBe(BUDGET_PRICES.meal!.price);
    expect(b.wants).toBe(BUDGET_PRICES.sweetSnack!.price);
    expect(remaining(b)).toBe(BUDGET_ALLOWANCE - 5);
    expect(daysLeft(b, MORNING + DAY)).toBe(6);
    expect(daysLeft(b, MORNING - MINUTE)).toBe(7);
    expect(budgetOver(b, MORNING + 7 * DAY)).toBe(true);
    expect(spend(b, 'meal', MORNING + 7 * DAY)).toBe(b);
  });

  it('settles great, short, overspent and skimped weeks', () => {
    const b = startBudget(MORNING, TODAY, 20);
    const great = settleBudget({ ...b, needs: 30 }, []);
    expect(great.outcome).toBe('great');
    expect(great.coins).toBe(40 + BUDGET_BONUS);
    expect(settleBudget({ ...b, needs: 30, wants: 30 }, []).outcome).toBe('short');
    const over = settleBudget({ ...b, needs: 50, wants: 30 }, []);
    expect(over.outcome).toBe('overspent');
    expect(over.coins).toBe(0);
    const skimped = settleBudget(b, [day(1, { missedCalls: 3 })]);
    expect(skimped.outcome).toBe('skimped');
    expect(skimped.coins).toBe(BUDGET_ALLOWANCE);
  });

  it('charges care actions and mini-games during the week', () => {
    let g = gameWithPet({
      stats: { hunger: 10, happiness: 50, energy: 90, hygiene: 50, health: 100 },
    });
    g = beginBudget(g, 10, MORNING);
    expect(beginBudget(g, 30, MORNING)).toBe(g);
    g = act(g, MORNING + MINUTE, NO_SLEEP, feedMeal, 'meal').game;
    g = feedSnackFood(g, MORNING + 2 * MINUTE, NO_SLEEP, 'cookie').game;
    g = feedSnackFood(g, MORNING + 3 * MINUTE, NO_SLEEP, 'apple').game;
    g = finishMinigame(g, MORNING + 4 * MINUTE, NO_SLEEP, 'leftRight', 0.5).game;
    expect(g.budget!.needs).toBe(3);
    expect(g.budget!.wants).toBe(2 + 1 + 2);
    expect(closeBudget(g, MORNING + DAY)).toBeNull();
    const res = closeBudget(g, MORNING + 7 * DAY + MINUTE)!;
    expect(res.result.outcome).toBe('great');
    expect(res.game.coins).toBe(g.coins + res.result.coins);
    expect(res.game.progress.budgetGoalsMet).toBe(1);
    expect(res.unlocked).toContain('budgeter');
    expect(cancelBudget(g).budget).toBeNull();
  });
});

describe('report card', () => {
  it('is empty without diary days', () => {
    expect(reportCard([], TODAY).days).toBe(0);
  });

  it('grades a great week A and a poor one D', () => {
    const great = Array.from({ length: 7 }, (_, i) =>
      day(-i, { care: { meal: 3, play: 2 }, answered: 4, responseMin: 20, wellRested: true }),
    );
    const card = reportCard(great, TODAY);
    expect(card.days).toBe(7);
    expect(card.lines.map((l) => l.grade)).toEqual(['A', 'A', 'A', 'A']);
    expect(card.overall).toBe('A');
    const poor = [day(0, { missedCalls: 9, answered: 2, responseMin: 120 })];
    const bad = reportCard(poor, TODAY);
    expect(bad.overall).toBe('D');
    expect(bad.lines.find((l) => l.category === 'response')!.value).toBe(60);
  });
});

describe('feelings check-in', () => {
  it('keeps one mood per day and the last 14 days', () => {
    let moods = recordMood([], TODAY, 'happy');
    moods = recordMood(moods, TODAY, 'tired');
    expect(moods).toEqual([{ day: TODAY, mood: 'tired' }]);
    for (let i = 1; i <= 20; i++) moods = recordMood(moods, shiftDay(TODAY, i), 'calm');
    expect(moods).toHaveLength(14);
    expect(isMood('sad')).toBe(true);
    expect(isMood('meh')).toBe(false);

    const g = checkIn(createDefaultGame(), 'worried', MORNING);
    expect(hasCheckedInToday(g, MORNING)).toBe(true);
    expect(hasCheckedInToday(g, MORNING + DAY)).toBe(false);
  });
});

describe('word snack spaced repetition', () => {
  it('moves words between boxes', () => {
    expect(nextBox(undefined, true)).toBe(UNSEEN_BOX + 1);
    expect(nextBox(3, false)).toBe(0);
    expect(nextBox(4, true)).toBe(4);
    expect(isLearned(3)).toBe(true);
    expect(isLearned(undefined)).toBe(false);
    expect(learnedCount(['a', 'b', 'c'], { a: 4, b: 1 })).toBe(1);
  });

  it('brings missed words back first', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const picked = pickWords(ids, { c: 0, d: 0, a: 4 }, 2, createRng(1));
    expect(picked.sort()).toEqual(['c', 'd']);
    expect(pickWords(ids, { a: 4 }, 5, createRng(2)).at(-1)).toBe('a');
  });

  it('records answers and immersion days in game', () => {
    let g = createDefaultGame();
    const answers = Array.from({ length: 50 }, (_, i) => ({ id: `w${i}`, correct: true }));
    for (let k = 0; k < 2; k++) g = recordWords(g, answers, MORNING).game;
    const res = recordWords(g, [{ id: 'w0', correct: false }], MORNING);
    expect(res.game.progress.words.w0).toBe(0);
    expect(res.game.progress.words.w1).toBe(3);
    expect(Object.keys(g.achievements)).toContain('polyglot');

    const on = setImmersionDay(createDefaultGame(), MORNING, true);
    expect(isImmersionDay(on, MORNING)).toBe(true);
    expect(isImmersionDay(on, MORNING + DAY)).toBe(false);
    expect(isImmersionDay(setImmersionDay(on, MORNING, false), MORNING)).toBe(false);
  });
});

describe('wild data', () => {
  it('has consistent data for every species', () => {
    for (const s of SPECIES) {
      const w = WILD[s];
      expect(w.lifespan[0]).toBeLessThanOrEqual(w.lifespan[1]);
      expect(w.regions.length).toBeGreaterThan(0);
      expect(w.stages.senior.to).toBeNull();
    }
  });
});

describe('save v3', () => {
  it('migrates v2 saves and keeps pets', () => {
    const pet = baby(MORNING, 1) as unknown as Record<string, unknown>;
    delete pet.sickCause;
    delete pet.sickClues;
    delete pet.caseSolved;
    const s = migrateSave({ settings: {}, game: { pet, coins: 12 } }, 2, 'en');
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.game.pet!.caseSolved).toBe(true);
    expect(s.game.pet!.sickCause).toBeNull();
    expect(s.game.progress.words).toEqual({});
    expect(s.game.budget).toBeNull();
  });

  it('sanitises learning state', () => {
    const s = migrateSave(
      {
        settings: {},
        game: {
          pet: { ...baby(MORNING, 1), sickCause: 'nope', sickClues: { hygiene: 'x' } },
          plate: { week: '2026-01-05', counts: { fruit: 2, veg: -1 }, claimed: true },
          experiment: { id: 'play', startDay: '2026-01-05' },
          budget: {
            startedAt: MORNING,
            startDay: '2026-01-05',
            goal: 999,
            allowance: 70,
            needs: 3,
            wants: 2,
          },
          diary: [{ day: '2026-01-05', care: {} }],
          progress: {
            bodyTopics: ['food', 'bogus'],
            words: { 'food:apple': 9, bad: 'x' },
            moods: [
              { day: '2026-01-05', mood: 'happy' },
              { day: 'x', mood: 'sad' },
            ],
            immersionDay: '2026-01-05',
            casesSolved: 2,
          },
        },
      },
      SCHEMA_VERSION,
      'en',
    );
    expect(s.game.pet!.sickCause).toBeNull();
    expect(s.game.pet!.sickClues).toBeNull();
    expect(s.game.plate!.counts).toMatchObject({ fruit: 2, veg: 0, treat: 0 });
    expect(s.game.experiment!.id).toBe('play');
    expect(s.game.budget!.goal).toBe(10);
    expect(s.game.diary[0]!.answered).toBe(0);
    expect(s.game.progress.bodyTopics).toEqual(['food']);
    expect(s.game.progress.words).toEqual({ 'food:apple': 4 });
    expect(s.game.progress.moods).toHaveLength(1);
    expect(s.game.progress.immersionDay).toBe('2026-01-05');
    expect(s.game.progress.casesSolved).toBe(2);
    const bad = migrateSave(
      {
        game: {
          experiment: { id: 'x', startDay: '2026-01-05' },
          budget: { startedAt: 'x' },
          plate: 5,
        },
      },
      SCHEMA_VERSION,
      'en',
    );
    expect(bad.game.experiment).toBeNull();
    expect(bad.game.budget).toBeNull();
    expect(bad.game.plate).toBeNull();
  });

  it('has 21 achievements including the learning badges', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    for (const id of ['detective', 'scientist', 'budgeter', 'balancedPlate', 'polyglot'])
      expect(ids).toContain(id);
  });
});
