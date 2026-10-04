import { describe, expect, it } from 'vitest';
import {
  clean,
  feedMeal,
  giveMedicine,
  play,
  scold,
  toggleLights,
  type ActionResult,
} from '../../src/game/actions';
import { DAY, MINUTE } from '../../src/game/constants';
import { act, startEgg, tick } from '../../src/game/game';
import { createDefaultGame, type GameState } from '../../src/game/save';
import { isBedtime } from '../../src/game/sleep';
import type { Pet } from '../../src/game/types';
import { MORNING, OPTS } from './helpers';

type Action = (pet: Pet, now: number) => ActionResult;

/** A scripted player who checks in every `interval` while awake (07:30–22:30). */
function caretaker(game: GameState, until: number, interval: number, attentive: boolean) {
  let g = game;
  const forms: string[] = [];
  for (let t = MORNING; t <= until; t += interval) {
    const r = tick(g, t, OPTS);
    g = r.game;
    for (const e of r.events) if (e.type === 'evolved') forms.push(`${e.stage}:${e.form}`);
    const pet = g.pet;
    if (!pet || pet.dead) break;
    const hour = new Date(t).getUTCHours() + new Date(t).getUTCMinutes() / 60;
    if (hour < 7.5 || hour > 22.5) continue; // player is asleep too

    const todo: Action[] = [];
    if (pet.actingUp && attentive) todo.push(scold);
    if (pet.sick) todo.push(giveMedicine, giveMedicine);
    if (pet.poops > 0 || pet.stats.hygiene < 50) todo.push(clean);
    if (pet.stats.hunger < 70) todo.push(feedMeal);
    if (pet.stats.hunger < 40) todo.push(feedMeal);
    if (pet.stats.happiness < 75) todo.push(play);
    if (pet.stats.happiness < 45) todo.push(play);
    const bedtimeSoon = isBedtime(t + interval, OPTS.bedtime);
    if (attentive && pet.lightsOn && (bedtimeSoon || (pet.stats.energy < 30 && !pet.asleep)))
      todo.push(toggleLights); // lights off before bed, or let a tired pet nap
    else if (attentive && !pet.lightsOn && !pet.asleep && !bedtimeSoon) todo.push(toggleLights);
    if (!attentive && isBedtime(t, OPTS.bedtime) && pet.lightsOn && pet.asleep)
      todo.push(toggleLights);
    for (const a of todo) g = act(g, t, OPTS, a).game;
  }
  return { game: g, forms };
}

const newGame = (seed: number) =>
  startEgg(createDefaultGame(), {
    id: 'scenario',
    name: 'Bot',
    species: 'panda',
    color: 1,
    now: MORNING,
    seed,
  });

describe('balance scenarios', () => {
  it('an attentive player raises a healthy adult with a good form', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      const { game, forms } = caretaker(newGame(seed), MORNING + 6.2 * DAY, 20 * MINUTE, true);
      expect(game.pet?.dead).toBe(false);
      expect(game.pet?.stage).toBe('adult');
      expect(game.pet?.form === 'star' || game.pet?.form === 'normal').toBe(true);
      expect(forms.some((f) => f.endsWith(':grumpy'))).toBe(false);
    }
  });

  it('a casual player (every 3 h) keeps the pet alive', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      const { game } = caretaker(newGame(seed), MORNING + 6.2 * DAY, 180 * MINUTE, true);
      expect(game.pet?.dead).toBe(false);
      expect(game.pet?.stage).toBe('adult');
    }
  });

  it('a careless player (twice a day) ends up with a grumpy or dead pet', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const { game, forms } = caretaker(
        newGame(seed),
        MORNING + 6.2 * DAY,
        12 * 60 * MINUTE,
        false,
      );
      const pet = game.pet!;
      expect(pet.dead || forms.some((f) => f.endsWith(':grumpy'))).toBe(true);
    }
  });
});
