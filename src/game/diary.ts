// Carer's diary: small per-day records that become a weekly reflection.
import { DIARY_DAYS } from './constants';
import type { Stats } from './types';

export type CareKind = 'meal' | 'snack' | 'play' | 'clean' | 'medicine' | 'stroke' | 'scold';

export interface DiaryDay {
  day: string; // YYYY-MM-DD local
  care: Partial<Record<CareKind, number>>;
  missedCalls: number;
  sick: boolean;
  wellRested: boolean;
  /** Time-weighted sums (stat × hours) and total hours sampled. */
  happiness: number;
  hunger: number;
  energy: number;
  hours: number;
}

export type Feeling = 'happy' | 'content' | 'lonely' | 'sleepy' | 'hungry' | 'sick';

export function emptyDay(day: string): DiaryDay {
  return {
    day,
    care: {},
    missedCalls: 0,
    sick: false,
    wellRested: false,
    happiness: 0,
    hunger: 0,
    energy: 0,
    hours: 0,
  };
}

/** Returns today's record, creating it (and trimming old days) if needed. Mutates. */
export function diaryDay(diary: DiaryDay[], day: string): DiaryDay {
  let rec = diary.find((d) => d.day === day);
  if (!rec) {
    rec = emptyDay(day);
    diary.push(rec);
    diary.sort((a, b) => a.day.localeCompare(b.day));
    while (diary.length > DIARY_DAYS) diary.shift();
  }
  return rec;
}

export function sampleStats(rec: DiaryDay, stats: Stats, hours: number): void {
  if (hours <= 0) return;
  rec.happiness += stats.happiness * hours;
  rec.hunger += stats.hunger * hours;
  rec.energy += stats.energy * hours;
  rec.hours += hours;
}

/** How the pet probably felt that day — helps put emotions into words. */
export function feelingOf(rec: DiaryDay): Feeling {
  if (rec.sick) return 'sick';
  const avg = (v: number) => (rec.hours > 0 ? v / rec.hours : 60);
  if (rec.missedCalls >= 2) return 'lonely';
  if (avg(rec.hunger) < 35) return 'hungry';
  if (avg(rec.energy) < 30) return 'sleepy';
  if (avg(rec.happiness) >= 65) return 'happy';
  if (avg(rec.happiness) < 40) return 'lonely';
  return 'content';
}

export function careTotal(rec: DiaryDay): number {
  return Object.values(rec.care).reduce((a, b) => a + (b ?? 0), 0);
}
