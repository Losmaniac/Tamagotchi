import { DAY, HOUR, MINUTE } from '../game/constants';
import type { PluralKey } from '../i18n/en';

type Tp = (key: PluralKey, count: number) => string;

/**
 * Human duration with the two largest units, e.g. "2 days 3 hours".
 * Czech needs grammatical case: 'nom' after a label ("Věk: 1 hodina"),
 * 'acc' after a preposition/verb ("za 1 hodinu", "žilo 1 hodinu").
 */
export function formatDuration(ms: number, tp: Tp, grammaticalCase: 'nom' | 'acc' = 'nom'): string {
  const k = (unit: 'seconds' | 'minutes' | 'hours' | 'days'): PluralKey =>
    grammaticalCase === 'nom' ? (`count.${unit}Nom` as PluralKey) : (`count.${unit}` as PluralKey);
  const total = Math.max(0, ms);
  const d = Math.floor(total / DAY);
  const h = Math.floor((total % DAY) / HOUR);
  const m = Math.floor((total % HOUR) / MINUTE);
  const s = Math.floor((total % MINUTE) / 1000);
  const parts: string[] = [];
  if (d) parts.push(tp(k('days'), d));
  if (h && parts.length < 2) parts.push(tp(k('hours'), h));
  if (m && parts.length < 2 && !d) parts.push(tp(k('minutes'), m));
  if (!parts.length) parts.push(tp(k('seconds'), total > 0 && s < 1 ? 1 : s));
  return parts.join(' ');
}

/** Short countdown clock: 4:05 or 1:02:03. */
export function formatClockDuration(ms: number): string {
  const t = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const ss = String(s).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}
