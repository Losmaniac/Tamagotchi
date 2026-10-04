// Pure Rhythm Tap timing logic (times in ms).
import { createRng } from '../game/rng';

export const BPM = 100;
export const BEAT_MS = 60_000 / BPM;
export const NOTE_COUNT = 24;
export const LEAD_BEATS = 3;
export const PERFECT_MS = 70;
export const GOOD_MS = 150;
/** Taps further than this from any note are ignored. */
export const TAP_WINDOW_MS = 220;
/** How long before its time a note's ring starts shrinking. */
export const APPROACH_MS = BEAT_MS * 2;

export type Judgement = 'perfect' | 'good' | 'miss';

export interface Note {
  time: number;
  judged: Judgement | null;
}

/** Notes mostly on the beat, with seeded off-beats and rests for variety. */
export function makeNotes(seed: number, start = 0): Note[] {
  const rng = createRng(seed);
  const notes: Note[] = [];
  let beat = LEAD_BEATS;
  while (notes.length < NOTE_COUNT) {
    notes.push({ time: start + beat * BEAT_MS, judged: null });
    const r = rng.next();
    beat += r < 0.15 ? 0.5 : r < 0.85 ? 1 : 2;
  }
  return notes;
}

export function judge(deltaMs: number): Judgement {
  const d = Math.abs(deltaMs);
  if (d <= PERFECT_MS) return 'perfect';
  if (d <= GOOD_MS) return 'good';
  return 'miss';
}

/** Applies a tap at `now`: judges the nearest open note. Mutates notes. */
export function tap(notes: Note[], now: number): Judgement | null {
  let best: Note | null = null;
  for (const n of notes) {
    if (n.judged) continue;
    if (Math.abs(n.time - now) > TAP_WINDOW_MS) continue;
    if (!best || Math.abs(n.time - now) < Math.abs(best.time - now)) best = n;
  }
  if (!best) return null;
  best.judged = judge(now - best.time);
  return best.judged;
}

/** Marks notes whose window has passed without a tap as misses. Returns how many. */
export function expire(notes: Note[], now: number): number {
  let count = 0;
  for (const n of notes) {
    if (!n.judged && now - n.time > GOOD_MS) {
      n.judged = 'miss';
      count++;
    }
  }
  return count;
}

export function rhythmScore(notes: Note[]): number {
  return notes.reduce((s, n) => s + (n.judged === 'perfect' ? 2 : n.judged === 'good' ? 1 : 0), 0);
}

export function rhythmNormalized(notes: Note[]): number {
  return rhythmScore(notes) / (notes.length * 2);
}

export function isRhythmOver(notes: Note[]): boolean {
  return notes.every((n) => n.judged !== null);
}
