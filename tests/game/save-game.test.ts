import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '../../src/game/achievements';
import { clean, feedMeal } from '../../src/game/actions';
import { DAY, HOUR, START_COINS } from '../../src/game/constants';
import {
  buyItem,
  finishMinigame,
  act,
  killNow,
  localDayKey,
  recordOpen,
  startEgg,
  tick,
  toggleEquip,
} from '../../src/game/game';
import {
  SCHEMA_VERSION,
  createDefaultGame,
  createDefaultSave,
  migrateSave,
  parseSave,
  serializeSave,
} from '../../src/game/save';
import { MORNING, NO_SLEEP, OPTS, baby } from './helpers';

describe('save migration and validation', () => {
  it('upgrades a version 0 save, keeping valid fields', () => {
    const s = migrateSave({ settings: { locale: 'cs', sound: false } }, 0, 'en');
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.settings.locale).toBe('cs');
    expect(s.settings.sound).toBe(false);
    expect(s.game.coins).toBe(START_COINS);
  });

  it('drops invalid fields back to defaults', () => {
    const s = migrateSave(
      {
        settings: { locale: 'xx', bedtime: { start: 5000, end: 60 } },
        game: {
          coins: -10,
          pet: { nope: true },
          inventory: {
            owned: ['crown', 'fake'],
            equipped: { hat: 'crown', glasses: 'sunglasses' },
          },
          achievements: { firstHatch: 5, bad: 'x' },
          progress: { bestScores: { snackCatch: 0.5, other: 1 }, lastOpenDay: '2026-01-01' },
          memorial: [{ name: 'A' }, 3],
          log: [{ t: 1, type: 'poop' }, { nope: 1 }],
        },
      },
      1,
      'en',
    );
    expect(s.settings.locale).toBe('en');
    expect(s.settings.bedtime).toEqual({ start: 22 * 60, end: 60 });
    expect(s.game.coins).toBe(0);
    expect(s.game.pet).toBeNull();
    expect(s.game.inventory).toEqual({ owned: ['crown'], equipped: { hat: 'crown' } });
    expect(s.game.achievements).toEqual({ firstHatch: 5 });
    expect(s.game.progress.bestScores).toEqual({ snackCatch: 0.5 });
    expect(s.game.memorial).toHaveLength(1);
    expect(s.game.log).toHaveLength(1);
  });

  it('resets garbage or saves from a newer version / without a migration path', () => {
    expect(migrateSave(null, 0, 'cs')).toEqual(createDefaultSave('cs'));
    expect(migrateSave({}, SCHEMA_VERSION + 1, 'en')).toEqual(createDefaultSave('en'));
    expect(migrateSave({}, -5, 'en')).toEqual(createDefaultSave('en'));
  });

  it('round-trips through export/import', () => {
    const save = createDefaultSave('cs');
    save.game.pet = baby();
    save.game.coins = 77;
    const parsed = parseSave(serializeSave(save, MORNING), 'en');
    expect(parsed).toEqual(save);
  });

  it('rejects files that are not Pocket Pals saves', () => {
    expect(parseSave('not json', 'en')).toBeNull();
    expect(parseSave('{"hello":1}', 'en')).toBeNull();
    expect(
      parseSave(JSON.stringify({ format: 'pocketpals-save', schemaVersion: 99 }), 'en'),
    ).toBeNull();
    expect(
      parseSave(
        JSON.stringify({ format: 'pocketpals-save', schemaVersion: 1, game: { pet: { bad: 1 } } }),
        'en',
      ),
    ).toBeNull();
  });
});

describe('game reducers', () => {
  const withPet = () => ({ ...createDefaultGame(), pet: baby(MORNING, 5) });

  it('startEgg creates a new pet', () => {
    const g = startEgg(createDefaultGame(), {
      id: 'x',
      name: 'Zip',
      species: 'dragon',
      color: 1,
      now: MORNING,
      seed: 3,
    });
    expect(g.pet?.stage).toBe('egg');
    expect(g.pet?.name).toBe('Zip');
  });

  it('tick without a pet is a no-op', () => {
    const r = tick(createDefaultGame(), MORNING, OPTS);
    expect(r.summary).toBeNull();
  });

  it('tick hatches, logs, counts progress and unlocks achievements', () => {
    const g = startEgg(createDefaultGame(), {
      id: 'x',
      name: 'Zip',
      species: 'cat',
      color: 0,
      now: MORNING,
      seed: 3,
    });
    const r = tick(g, MORNING + 10 * 60_000, OPTS);
    expect(r.game.pet?.stage).toBe('baby');
    expect(r.game.progress.hatched).toBe(1);
    expect(r.game.log.some((e) => e.type === 'hatched')).toBe(true);
    expect(r.unlocked).toContain('firstHatch');
    expect(r.summary?.hatched).toBe(true);
  });

  it('caps the log at 50 entries', () => {
    const r = tick(
      {
        ...withPet(),
        log: Array.from({ length: 60 }, (_, i) => ({ t: i, type: 'poop' as const })),
      },
      MORNING + 3 * HOUR,
      NO_SLEEP,
    );
    expect(r.game.log.length).toBeLessThanOrEqual(50);
  });

  it('pays survival coins into the wallet and records evolution', () => {
    const g = withPet();
    // Hatched 23 h ago and simulated up to now: the next 2 h cross day 1.
    g.pet = { ...g.pet!, hatchedAt: MORNING - 23 * HOUR, stageDuration: HOUR };
    const r = tick(g, MORNING + 2 * HOUR, NO_SLEEP);
    expect(r.game.coins).toBeGreaterThanOrEqual(START_COINS + 10);
    expect(r.game.progress.bestStage).toBeGreaterThanOrEqual(2);
    expect(r.game.log.some((e) => e.type === 'evolved')).toBe(true);
  });

  it('adds dead pets to the memorial once', () => {
    const g = withPet();
    const r = tick(g, MORNING + 15 * DAY, OPTS);
    expect(r.game.memorial).toHaveLength(1);
    expect(['neglect', 'sickness']).toContain(r.game.memorial[0]?.cause);
    const again = tick(r.game, MORNING + 16 * DAY, OPTS);
    expect(again.game.memorial).toHaveLength(1);
  });

  it('act advances time, then applies the action', () => {
    const g = withPet();
    const r = act(g, MORNING + 6 * HOUR, NO_SLEEP, feedMeal);
    expect(r.outcome).toBe('ok');
    expect(r.game.pet!.stats.hunger).toBeCloseTo(100 - 36 + 30, 0);
  });

  it('act counts cleaned poops', () => {
    const g = withPet();
    g.pet = { ...g.pet!, poops: 3 };
    const r = act(g, MORNING, NO_SLEEP, clean);
    expect(r.game.progress.poopsCleaned).toBe(3);
  });

  it('act without a pet returns no outcome', () => {
    expect(act(createDefaultGame(), MORNING, OPTS, feedMeal).outcome).toBeNull();
  });

  it('mini-games pay coins and track best scores', () => {
    const r = finishMinigame(withPet(), MORNING, NO_SLEEP, 'snackCatch', 0.95);
    expect(r.coins).toBe(24);
    expect(r.game.coins).toBe(START_COINS + 24);
    expect(r.game.progress.gamesPlayed).toBe(1);
    expect(r.game.progress.bestScores.snackCatch).toBe(0.95);
    expect(r.unlocked).toEqual(expect.arrayContaining(['firstGame', 'highScore']));
    const asleep = withPet();
    asleep.pet = {
      ...asleep.pet!,
      asleep: true,
      sleepReason: 'nap',
      lightsOn: false,
      stats: { ...asleep.pet!.stats, energy: 10 },
    };
    expect(finishMinigame(asleep, MORNING, NO_SLEEP, 'leftRight', 1).coins).toBe(0);
  });

  it('buys, equips and unequips cosmetics', () => {
    const g = { ...createDefaultGame(), coins: 200 };
    expect(buyItem(g, 'crown', MORNING).outcome).toBe('ok');
    const bought = buyItem(g, 'crown', MORNING).game;
    expect(bought.coins).toBe(80);
    expect(bought.inventory.equipped.hat).toBe('crown');
    expect(bought.progress.purchases).toBe(1);
    expect(buyItem(bought, 'crown', MORNING).outcome).toBe('owned');
    expect(buyItem({ ...bought, coins: 0 }, 'bgSpace', MORNING).outcome).toBe('poor');
    expect(buyItem(bought, 'nope' as never, MORNING).outcome).toBe('unknown');

    const off = toggleEquip(bought, 'crown', MORNING).game;
    expect(off.inventory.equipped.hat).toBeUndefined();
    const on = toggleEquip(off, 'crown', MORNING).game;
    expect(on.inventory.equipped.hat).toBe('crown');
    expect(toggleEquip(on, 'beanie', MORNING).game).toBe(on);
  });

  it('fashionista needs three worn accessories', () => {
    let g = { ...createDefaultGame(), coins: 500 };
    for (const id of ['partyHat', 'roundGlasses', 'redScarf'] as const)
      g = buyItem(g, id, MORNING).game;
    expect(g.achievements.fashionista).toBeDefined();
  });

  it('tracks daily-open streaks', () => {
    let g = createDefaultGame();
    for (let d = 0; d < 7; d++) g = recordOpen(g, MORNING + d * DAY).game;
    expect(g.progress.streak).toBe(7);
    expect(g.achievements.streak7).toBeDefined();
    expect(recordOpen(g, MORNING + 6 * DAY + HOUR).game).toBe(g);
    expect(recordOpen(g, MORNING + 9 * DAY).game.progress.streak).toBe(1);
    expect(localDayKey(Date.UTC(2026, 2, 7, 12))).toBe('2026-03-07');
  });

  it('defines ~15 achievements with unique ids', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(15);
  });
});

describe('killNow', () => {
  it('kills the pet and records it in the memorial once', () => {
    const g = { ...createDefaultGame(), pet: baby(MORNING, 5) };
    const r = killNow(g, MORNING + HOUR);
    expect(r.game.pet?.dead).toBe(true);
    expect(r.game.memorial).toHaveLength(1);
    expect(killNow(r.game, MORNING + 2 * HOUR).game.memorial).toHaveLength(1);
  });
});
