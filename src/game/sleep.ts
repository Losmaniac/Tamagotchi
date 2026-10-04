import type { Bedtime } from './types';

/** Minutes after local midnight for a timestamp (uses the device's time zone). */
export function localMinutes(t: number): number {
  const d = new Date(t);
  return d.getHours() * 60 + d.getMinutes();
}

export function isBedtime(t: number, bedtime: Bedtime): boolean {
  const m = localMinutes(t);
  const { start, end } = bedtime;
  if (start === end) return false;
  return start < end ? m >= start && m < end : m >= start || m < end;
}

export function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function parseClock(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}
