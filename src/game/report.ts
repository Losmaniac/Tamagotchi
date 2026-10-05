// Weekly responsibility report card, computed from the last 7 diary days.
import { careTotal, daysBetween, shiftDay, type DiaryDay } from './diary';

export type Grade = 'A' | 'B' | 'C' | 'D';
export type ReportCategory = 'consistency' | 'response' | 'needs' | 'routine';

export interface ReportLine {
  category: ReportCategory;
  grade: Grade;
  /** The number behind the grade (days, minutes or calls). */
  value: number;
}

export interface ReportCard {
  lines: ReportLine[];
  overall: Grade;
  days: number;
}

const GRADES: Grade[] = ['A', 'B', 'C', 'D'];

/** Grades `value` against thresholds: [A, B, C] — higher is better unless `lower`. */
function grade(value: number, [a, b, c]: [number, number, number], lower = false): Grade {
  const ok = (limit: number) => (lower ? value <= limit : value >= limit);
  return ok(a) ? 'A' : ok(b) ? 'B' : ok(c) ? 'C' : 'D';
}

export const REPORT_DAYS = 7;

export function reportCard(diary: DiaryDay[], today: string): ReportCard {
  const days = daysBetween(diary, shiftDay(today, -(REPORT_DAYS - 1)), today);
  const caredDays = days.filter((d) => careTotal(d) >= 3).length;
  const answered = days.reduce((a, d) => a + (d.answered ?? 0), 0);
  const minutes = days.reduce((a, d) => a + (d.responseMin ?? 0), 0);
  const avgResponse = answered > 0 ? Math.round(minutes / answered) : 0;
  const missed = days.reduce((a, d) => a + d.missedCalls, 0);
  const rested = days.filter((d) => d.wellRested).length;
  const lines: ReportLine[] = [
    { category: 'consistency', grade: grade(caredDays, [6, 4, 2]), value: caredDays },
    { category: 'response', grade: grade(avgResponse, [10, 20, 40], true), value: avgResponse },
    { category: 'needs', grade: grade(missed, [0, 2, 5], true), value: missed },
    { category: 'routine', grade: grade(rested, [5, 3, 1]), value: rested },
  ];
  const mean = lines.reduce((a, l) => a + GRADES.indexOf(l.grade), 0) / lines.length;
  return { lines, overall: GRADES[Math.round(mean)]!, days: days.length };
}
