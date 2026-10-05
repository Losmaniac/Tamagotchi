// Real-world time for the scenery: sky phase by local clock, season by month.

export type SkyPhase = 'night' | 'dawn' | 'day' | 'golden' | 'dusk';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/** Sky phase for minutes after local midnight. */
export function skyPhase(minutes: number): SkyPhase {
  const h = (((minutes % 1440) + 1440) % 1440) / 60;
  if (h < 5.5 || h >= 21) return 'night';
  if (h < 8) return 'dawn';
  if (h < 17) return 'day';
  if (h < 19.5) return 'golden';
  return 'dusk';
}

/** Northern-hemisphere meteorological seasons (month 0 = January). */
export function seasonOf(month: number): Season {
  const m = ((month % 12) + 12) % 12;
  if (m === 11 || m <= 1) return 'winter';
  if (m <= 4) return 'spring';
  if (m <= 7) return 'summer';
  return 'autumn';
}

/** True within `window` minutes before bedtime (the pet starts yawning). */
export function isNearBedtime(minutes: number, bedtimeStart: number, window = 30): boolean {
  const diff = (((bedtimeStart - minutes) % 1440) + 1440) % 1440;
  return diff > 0 && diff <= window;
}
