import { describe, expect, it } from 'vitest';
import { feedSnack } from '../../src/game/actions';
import {
  accrueInterest,
  createBank,
  deposit,
  interestFor,
  timeToNextInterest,
  withdraw,
} from '../../src/game/bank';
import {
  BANK_PERIOD,
  BEGINNER_DURATION,
  DAY,
  HOUR,
  MINUTE,
  QUIZ_COINS_PER_CORRECT,
} from '../../src/game/constants';
import {
  careTotal,
  diaryDay,
  emptyDay,
  feelingOf,
  sampleStats,
  type DiaryDay,
} from '../../src/game/diary';
import { factIndexForDay, hasSeen, learnedFacts, makeQuiz, markSeen } from '../../src/game/facts';
import { FAVORITE_FOOD, getSnack, isSnackId } from '../../src/game/food';
import {
  act,
  bankDeposit,
  bankWithdraw,
  canQuizToday,
  feedSnackFood,
  finishQuiz,
  learnFact,
  startEgg,
  tick,
} from '../../src/game/game';
import { clean } from '../../src/game/actions';
import { createDefaultGame, migrateSave } from '../../src/game/save';
import { advance } from '../../src/game/simulation';
import { isNearBedtime, seasonOf, skyPhase } from '../../src/game/world';
import { makeWordRounds, wordNormalized } from '../../src/minigames/wordSnackLogic';
import { MORNING, NIGHT, NO_SLEEP, OPTS, baby, round } from './helpers';

describe('world', () => {
  it('maps the clock to sky phases', () => {
    expect(skyPhase(3 * 60)).toBe('night');
    expect(skyPhase(6 * 60)).toBe('dawn');
    expect(skyPhase(12 * 60)).toBe('day');
    expect(skyPhase(18 * 60)).toBe('golden');
    expect(skyPhase(20 * 60)).toBe('dusk');
    expect(skyPhase(22 * 60)).toBe('night');
  });

  it('maps months to seasons', () => {
    expect(seasonOf(0)).toBe('winter');
    expect(seasonOf(3)).toBe('spring');
    expect(seasonOf(6)).toBe('summer');
    expect(seasonOf(9)).toBe('autumn');
    expect(seasonOf(11)).toBe('winter');
  });

  it('detects the half hour before bedtime, across midnight too', () => {
    expect(isNearBedtime(21 * 60 + 40, 22 * 60)).toBe(true);
    expect(isNearBedtime(21 * 60, 22 * 60)).toBe(false);
    expect(isNearBedtime(22 * 60, 22 * 60)).toBe(false);
    expect(isNearBedtime(23 * 60 + 50, 10)).toBe(true);
  });
});

describe('gentle start', () => {
  it('the first pet drains at half speed for two days', () => {
    const game = startEgg(createDefaultGame(), {
      id: 'a',
      name: 'A',
      species: 'cat',
      color: 0,
      now: MORNING,
      seed: 1,
    });
    expect(game.pet!.beginner).toBe(true);
    const hatched = advance(game.pet!, MORNING + 5 * MINUTE, NO_SLEEP).pet;
    expect(hatched.gentleUntil).toBe(MORNING + 5 * MINUTE + BEGINNER_DURATION);
    const later = advance(hatched, MORNING + 5 * MINUTE + HOUR, NO_SLEEP).pet;
    expect(round(later.stats.hunger)).toBe(80 - 3);
  });

  it('later pets get the normal rules', () => {
    const g = { ...createDefaultGame(), progress: { ...createDefaultGame().progress, hatched: 1 } };
    expect(
      startEgg(g, { id: 'b', name: 'B', species: 'cat', color: 0, now: MORNING, seed: 1 }).pet!
        .beginner,
    ).toBe(false);
  });
});

describe('sleep well', () => {
  it('a dark night gives a well-rested bonus in the morning', () => {
    const p = baby(NIGHT, 3, { asleep: true, sleepReason: 'bedtime', lightsOn: false });
    const r = advance(p, NIGHT + 9 * HOUR + 10 * MINUTE, OPTS);
    expect(r.events.some((e) => e.type === 'wellRested')).toBe(true);
  });

  it('lights left on all night means no bonus', () => {
    const p = baby(NIGHT - 10 * MINUTE, 3, { lightsOn: true });
    const r = advance(p, NIGHT + 9 * HOUR + 10 * MINUTE, OPTS);
    expect(r.events.some((e) => e.type === 'wellRested')).toBe(false);
  });
});

describe('birthdays', () => {
  it('celebrates day 1 and day 7 with gifts', () => {
    const g = {
      ...createDefaultGame(),
      pet: baby(MORNING, 2, { stageDuration: 30 * DAY, hatchedAt: MORNING - 23 * HOUR }),
    };
    const r = tick(g, MORNING + 2 * HOUR, NO_SLEEP);
    expect(r.events.find((e) => e.type === 'birthday')).toMatchObject({ days: 1 });
    expect(r.game.coins).toBe(g.coins + 10 + 10);
  });
});

describe('snacks and favourites', () => {
  it('sweet snacks are fun, healthy snacks add health', () => {
    const half = { hunger: 50, happiness: 50, energy: 50, hygiene: 50, health: 50 };
    const sweet = feedSnack(baby(MORNING, 1, { stats: { ...half } }), MORNING, 'cookie').pet;
    const healthy = feedSnack(baby(MORNING, 1, { stats: { ...half } }), MORNING, 'apple').pet;
    expect(sweet.stats.happiness).toBeGreaterThan(healthy.stats.happiness);
    expect(healthy.stats.health).toBeGreaterThan(sweet.stats.health);
  });

  it('discovers a favourite food with extra joy', () => {
    const g = {
      ...createDefaultGame(),
      pet: baby(MORNING, 1, {
        species: 'bunny',
        stats: { hunger: 40, happiness: 40, energy: 80, hygiene: 80, health: 90 },
      }),
    };
    const r = feedSnackFood(g, MORNING, NO_SLEEP, FAVORITE_FOOD.bunny);
    expect(r.outcome).toBe('favorite');
    expect(r.game.progress.favorites.bunny).toBe('carrot');
    expect(feedSnackFood(g, MORNING, NO_SLEEP, 'fish').outcome).toBe('ok');
    expect(isSnackId('carrot')).toBe(true);
    expect(isSnackId('pizza')).toBe(false);
    expect(getSnack('nope')).toBeUndefined();
  });
});

describe('piggy bank', () => {
  it('earns compound interest per full period', () => {
    const bank = createBank();
    deposit(bank, 100, MORNING);
    expect(accrueInterest(bank, MORNING + BANK_PERIOD - 1)).toBe(0);
    expect(accrueInterest(bank, MORNING + 2 * BANK_PERIOD)).toBe(5 + 5);
    expect(bank.balance).toBe(110);
    expect(timeToNextInterest(bank, MORNING + 2 * BANK_PERIOD)).toBe(BANK_PERIOD);
    expect(withdraw(bank, 500, MORNING + 2 * BANK_PERIOD)).toBe(110);
    expect(timeToNextInterest(bank, MORNING)).toBeNull();
    expect(interestFor(10)).toBe(1);
    expect(interestFor(0)).toBe(0);
    expect(accrueInterest(createBank(), MORNING)).toBe(0);
  });

  it('moves coins between wallet and bank', () => {
    const g = { ...createDefaultGame(), coins: 50 };
    const d = bankDeposit(g, 80, MORNING);
    expect(d.coins).toBe(0);
    expect(d.bank.balance).toBe(50);
    expect(bankDeposit(d, 10, MORNING)).toBe(d);
    const w = bankWithdraw(d, 20, MORNING + HOUR);
    expect(w.coins).toBe(20);
    expect(w.bank.balance).toBe(30);
  });
});

describe('diary', () => {
  it('records care, missed calls and feelings per day', () => {
    const g = { ...createDefaultGame(), pet: baby(MORNING, 1, { poops: 2 }) };
    const r = act(g, MORNING, NO_SLEEP, clean, 'clean');
    expect(r.game.diary[0]?.care.clean).toBe(1);
    const sad = emptyDay('2026-01-01');
    sad.missedCalls = 3;
    expect(feelingOf(sad)).toBe('lonely');
    const happy = emptyDay('2026-01-02');
    sampleStats(happy, { hunger: 80, happiness: 90, energy: 80, hygiene: 80, health: 100 }, 5);
    expect(feelingOf(happy)).toBe('happy');
    sampleStats(happy, { hunger: 80, happiness: 90, energy: 80, hygiene: 80, health: 100 }, 0);
    expect(feelingOf({ ...happy, sick: true })).toBe('sick');
    const hungry = emptyDay('x');
    sampleStats(hungry, { hunger: 10, happiness: 50, energy: 80, hygiene: 80, health: 100 }, 2);
    expect(feelingOf(hungry)).toBe('hungry');
    const sleepy = emptyDay('y');
    sampleStats(sleepy, { hunger: 80, happiness: 50, energy: 10, hygiene: 80, health: 100 }, 2);
    expect(feelingOf(sleepy)).toBe('sleepy');
    expect(feelingOf(emptyDay('z'))).toBe('content');
    expect(careTotal({ ...emptyDay('q'), care: { meal: 2, play: 1 } })).toBe(3);
  });

  it('keeps only the last 14 days', () => {
    const diary: DiaryDay[] = [];
    for (let i = 1; i <= 20; i++) diaryDay(diary, `2026-01-${String(i).padStart(2, '0')}`);
    expect(diary).toHaveLength(14);
    expect(diary[0]!.day).toBe('2026-01-07');
  });
});

describe('facts and quiz', () => {
  it('tells one fact per day of age and remembers learned ones', () => {
    const p = baby(MORNING, 1);
    expect(factIndexForDay(p, MORNING + HOUR)).toBe(0);
    expect(factIndexForDay(p, MORNING + 9 * DAY)).toBe(1);
    expect(factIndexForDay({ ...p, hatchedAt: null }, MORNING)).toBeNull();
    expect(factIndexForDay(p, MORNING - 1000)).toBe(0); // clock slightly behind hatch
    expect(markSeen({}, 'cat', -1)).toEqual({});
    expect(markSeen({}, 'cat', 8)).toEqual({});
    let g = learnFact(createDefaultGame(), 'cat', 3);
    expect(hasSeen(g.progress.factsSeen, 'cat', 3)).toBe(true);
    expect(learnFact(g, 'cat', 3)).toBe(g);
    g = learnFact(learnFact(g, 'fox', 0), 'panda', 7);
    expect(learnedFacts(g.progress.factsSeen)).toHaveLength(3);
  });

  it('builds quiz questions with the right answer among 3 options', () => {
    const seen = markSeen(markSeen(markSeen({}, 'cat', 1), 'dog', 2), 'dragon', 5);
    const quiz = makeQuiz(seen, 4);
    expect(quiz).toHaveLength(3);
    for (const q of quiz) {
      expect(q.options).toHaveLength(3);
      expect(new Set(q.options).size).toBe(3);
      expect(q.options).toContain(q.species);
    }
  });

  it('pays the quiz reward once a day', () => {
    const g = createDefaultGame();
    const r = finishQuiz(g, MORNING, 4);
    expect(r.coins).toBe(4 * QUIZ_COINS_PER_CORRECT);
    expect(canQuizToday(r.game, MORNING + HOUR)).toBe(false);
    expect(finishQuiz(r.game, MORNING + HOUR, 5).coins).toBe(0);
    expect(canQuizToday(r.game, MORNING + DAY)).toBe(true);
  });
});

describe('word snack', () => {
  it('makes 8 unique rounds with 3 options each', () => {
    const rounds = makeWordRounds(3, 24);
    expect(rounds).toHaveLength(8);
    expect(new Set(rounds.map((r) => r.answer)).size).toBe(8);
    for (const r of rounds) {
      expect(r.options).toContain(r.answer);
      expect(new Set(r.options).size).toBe(3);
    }
    expect(makeWordRounds(3, 2)).toHaveLength(2);
    expect(wordNormalized(6)).toBe(0.75);
  });
});

describe('save v2 migration', () => {
  it('upgrades v1 saves with pets to v2 without losing them', () => {
    const pet = baby(MORNING, 1) as unknown as Record<string, unknown>;
    delete pet.beginner;
    delete pet.gentleUntil;
    delete pet.nightLightsOnMs;
    const s = migrateSave({ settings: { locale: 'cs' }, game: { pet, coins: 99 } }, 1, 'en');
    expect(s.schemaVersion).toBe(2);
    expect(s.game.pet?.name).toBe('Mochi');
    expect(s.game.pet?.gentleUntil).toBe(0);
    expect(s.game.coins).toBe(99);
    expect(s.game.bank.balance).toBe(0);
    expect(s.settings.music).toBe(false);
  });

  it('sanitises bank, diary, facts and favourites', () => {
    const s = migrateSave(
      {
        game: {
          bank: { balance: -5, periodStart: 10, history: [{ t: 1, balance: 2 }, { bad: 1 }] },
          diary: [{ day: '2026-01-01', care: {} }, { nope: 1 }],
          progress: {
            factsSeen: { cat: 3, dog: -1, x: 1 },
            favorites: { cat: 'fish', dog: 'pizza' },
            lastQuizDay: '2026-01-01',
          },
        },
      },
      2,
      'en',
    );
    expect(s.game.bank).toEqual({ balance: 0, periodStart: 10, history: [{ t: 1, balance: 2 }] });
    expect(s.game.diary).toHaveLength(1);
    expect(s.game.progress.factsSeen).toEqual({ cat: 3 });
    expect(s.game.progress.favorites).toEqual({ cat: 'fish' });
    expect(s.game.progress.lastQuizDay).toBe('2026-01-01');
    expect(migrateSave({ game: { bank: 5 } }, 2, 'en').game.bank.balance).toBe(0);
  });
});
