import {
  CARE_MISTAKE_PENALTY,
  DISCIPLINE_WEIGHT,
  GRUMPY_SCORE,
  IGNORED_ACT_PENALTY,
  SENIOR_MAX,
  SENIOR_MIN,
  STAGE_DURATION,
  STAR_SCORE,
} from './constants';
import type { Rng } from './rng';
import { STAGES, type Form, type Stage, type StageRecord } from './types';

/**
 * Care score for a finished stage: average care stats, minus care mistakes and
 * ignored tantrums, plus a bonus for discipline (0–100).
 */
export function careScore(record: StageRecord, discipline: number): number {
  const avg = record.samples > 0 ? record.statSum / record.samples : 50;
  return (
    avg -
    CARE_MISTAKE_PENALTY * record.careMistakes -
    IGNORED_ACT_PENALTY * record.ignoredActs +
    DISCIPLINE_WEIGHT * discipline
  );
}

export function formForScore(score: number): Form {
  if (score >= STAR_SCORE) return 'star';
  if (score < GRUMPY_SCORE) return 'grumpy';
  return 'normal';
}

export function nextStage(stage: Stage): Stage | null {
  const i = STAGES.indexOf(stage);
  return STAGES[i + 1] ?? null;
}

export function stageDuration(stage: Stage, rng: Rng): number {
  if (stage === 'senior') return SENIOR_MIN + rng.next() * (SENIOR_MAX - SENIOR_MIN);
  return STAGE_DURATION[stage];
}

export function emptyStageRecord(): StageRecord {
  return { statSum: 0, samples: 0, careMistakes: 0, ignoredActs: 0 };
}
