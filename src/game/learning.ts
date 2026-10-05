// Small learning-progress helpers: Body book pages and daily feelings check-ins.
import { MOOD_DAYS } from './constants';
import type { CallKind, Pet } from './types';

export const BODY_TOPICS = ['food', 'play', 'sleep', 'hygiene', 'germs', 'medicine'] as const;
export type BodyTopic = (typeof BODY_TOPICS)[number];

/** Which Body book page a need unlocks. */
export const TOPIC_FOR_CALL: Record<CallKind, BodyTopic> = {
  hunger: 'food',
  happiness: 'play',
  energy: 'sleep',
  lights: 'sleep',
  hygiene: 'hygiene',
};

/** Pages unlocked by the pet's current state. */
export function topicsFromPet(pet: Pet): BodyTopic[] {
  const out = new Set<BodyTopic>();
  for (const kind of Object.keys(pet.calls) as CallKind[]) out.add(TOPIC_FOR_CALL[kind]);
  if (pet.sick) out.add('germs');
  return [...out];
}

/** Adds topics, keeping the canonical order. Returns the same array if nothing changed. */
export function unlockTopics(have: BodyTopic[], add: BodyTopic[]): BodyTopic[] {
  if (add.every((t) => have.includes(t))) return have;
  const set = new Set([...have, ...add]);
  return BODY_TOPICS.filter((t) => set.has(t));
}

export const MOODS = [
  'happy',
  'calm',
  'excited',
  'tired',
  'sad',
  'worried',
  'angry',
  'lonely',
] as const;
export type Mood = (typeof MOODS)[number];
/** Feelings where the pet also suggests talking to someone. */
export const HEAVY_MOODS: readonly Mood[] = ['sad', 'worried', 'angry', 'lonely'];

export const MOOD_ICON: Record<Mood, string> = {
  happy: '😄',
  calm: '😌',
  excited: '🤩',
  tired: '🥱',
  sad: '😢',
  worried: '😟',
  angry: '😠',
  lonely: '🫥',
};

export interface MoodEntry {
  day: string;
  mood: Mood;
}

/** Records today's check-in (replacing an earlier one today) and keeps the last few days. */
export function recordMood(moods: MoodEntry[], day: string, mood: Mood): MoodEntry[] {
  return [...moods.filter((m) => m.day !== day), { day, mood }]
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(-MOOD_DAYS);
}

export function isMood(v: unknown): v is Mood {
  return typeof v === 'string' && (MOODS as readonly string[]).includes(v);
}
