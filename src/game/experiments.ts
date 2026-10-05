// Care experiments: a gentle introduction to the scientific method.
// Pick a hypothesis, measure a "before" baseline from the diary, change one thing for a few
// days, then compare and draw a conclusion.
import {
  EXPERIMENT_BASELINE_DAYS,
  EXPERIMENT_BONUS_COINS,
  EXPERIMENT_COINS,
  EXPERIMENT_DAYS,
  EXPERIMENT_THRESHOLD,
} from './constants';
import { average, careTotal, daysBetween, shiftDay, type DiaryDay } from './diary';

export const EXPERIMENT_IDS = ['play', 'stroke', 'meals', 'sleep'] as const;
export type ExperimentId = (typeof EXPERIMENT_IDS)[number];
export type Metric = 'happiness' | 'energy' | 'hunger';

export interface ExperimentDef {
  id: ExperimentId;
  icon: string;
  /** What gets measured. */
  metric: Metric;
  /** How much of the "changed thing" happened on a day. */
  variable: (d: DiaryDay) => number;
}

export const EXPERIMENTS: Record<ExperimentId, ExperimentDef> = {
  play: { id: 'play', icon: '🎾', metric: 'happiness', variable: (d) => d.care.play ?? 0 },
  stroke: { id: 'stroke', icon: '🤲', metric: 'happiness', variable: (d) => d.care.stroke ?? 0 },
  meals: {
    id: 'meals',
    icon: '🍱',
    metric: 'hunger',
    variable: (d) => (d.care.meal ?? 0) - (d.care.snack ?? 0),
  },
  sleep: { id: 'sleep', icon: '🌙', metric: 'energy', variable: (d) => (d.wellRested ? 1 : 0) },
};

export interface Experiment {
  id: ExperimentId;
  /** First test day (YYYY-MM-DD). */
  startDay: string;
}

export type Conclusion = 'supported' | 'notSupported' | 'unclear' | 'unfair';

export interface Measurement {
  /** Average metric value (0–100), null when there is no data. */
  metric: number | null;
  /** Average daily amount of the changed thing. */
  variable: number;
  days: number;
}

export interface ExperimentResult {
  before: Measurement;
  after: Measurement;
  /** The conclusion the data supports. */
  expected: Conclusion;
}

function measure(def: ExperimentDef, days: DiaryDay[]): Measurement {
  const used = days.filter((d) => d.hours > 0);
  return {
    metric: average(used, def.metric),
    variable: used.length ? used.reduce((a, d) => a + def.variable(d), 0) / used.length : 0,
    days: used.length,
  };
}

/** A baseline needs at least one cared-for day before today. */
export function baselineDays(diary: DiaryDay[], today: string): DiaryDay[] {
  const first = shiftDay(today, -EXPERIMENT_BASELINE_DAYS);
  return daysBetween(diary, first, shiftDay(today, -1)).filter(
    (d) => d.hours > 0 && careTotal(d) > 0,
  );
}

export function canStartExperiment(diary: DiaryDay[], today: string): boolean {
  return baselineDays(diary, today).length > 0;
}

export function startExperiment(id: ExperimentId, today: string): Experiment {
  return { id, startDay: today };
}

/** The last test day; results are ready the day after it. */
export function lastTestDay(exp: Experiment): string {
  return shiftDay(exp.startDay, EXPERIMENT_DAYS - 1);
}

export function isFinished(exp: Experiment, today: string): boolean {
  return today > lastTestDay(exp);
}

/** Which test day it is (1-based), capped at the experiment length. */
export function testDayNumber(exp: Experiment, today: string): number {
  let day = 1;
  while (day < EXPERIMENT_DAYS && shiftDay(exp.startDay, day) <= today) day++;
  return day;
}

export function evaluate(exp: Experiment, diary: DiaryDay[]): ExperimentResult {
  const def = EXPERIMENTS[exp.id];
  const before = measure(def, baselineDays(diary, exp.startDay));
  const after = measure(def, daysBetween(diary, exp.startDay, lastTestDay(exp)));
  let expected: Conclusion;
  if (before.metric === null || after.metric === null || after.variable <= before.variable)
    expected = 'unfair';
  else {
    const change = after.metric - before.metric;
    expected =
      change >= EXPERIMENT_THRESHOLD
        ? 'supported'
        : change <= -EXPERIMENT_THRESHOLD
          ? 'notSupported'
          : 'unclear';
  }
  return { before, after, expected };
}

/** Coins for finishing: always some, plus a bonus for reading the data right. */
export function experimentCoins(expected: Conclusion, picked: Conclusion): number {
  return EXPERIMENT_COINS + (expected === picked ? EXPERIMENT_BONUS_COINS : 0);
}
