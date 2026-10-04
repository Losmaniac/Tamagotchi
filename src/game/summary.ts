import { HOUR } from './constants';
import type { DeathCause, Form, Pet, SimEvent, Stage, StatKey } from './types';

export interface AwaySummary {
  from: number;
  to: number;
  statDelta: Record<StatKey, number>;
  poops: number;
  gotSick: boolean;
  hatched: boolean;
  evolved: { stage: Stage; form: Form }[];
  careMistakes: number;
  actsIgnored: number;
  coins: number;
  died: DeathCause | null;
}

/** Below this the "While you were away…" card is not worth showing. */
export const SUMMARY_MIN_AWAY = 0.25 * HOUR;

export function summarize(
  before: Pet,
  after: Pet,
  events: SimEvent[],
  from: number,
  to: number,
  coins: number,
): AwaySummary {
  const statDelta = {} as Record<StatKey, number>;
  for (const k of Object.keys(after.stats) as StatKey[]) {
    statDelta[k] = Math.round(after.stats[k]) - Math.round(before.stats[k]);
  }
  const count = (type: SimEvent['type']) => events.filter((e) => e.type === type).length;
  const died = events.find((e) => e.type === 'died');
  return {
    from,
    to,
    statDelta,
    poops: count('poop'),
    gotSick: count('sick') > 0,
    hatched: count('hatched') > 0,
    evolved: events.flatMap((e) =>
      e.type === 'evolved' ? [{ stage: e.stage, form: e.form }] : [],
    ),
    careMistakes: count('careMistake'),
    actsIgnored: count('actIgnored'),
    coins,
    died: died?.type === 'died' ? died.cause : null,
  };
}

export function isSummaryWorthShowing(s: AwaySummary): boolean {
  return s.to - s.from >= SUMMARY_MIN_AWAY || s.died !== null || s.hatched;
}
