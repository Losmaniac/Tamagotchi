import type { Locale } from '../../game/save';
import type { AgeRange, AgeUnit } from '../../game/wild';

/** "6 months", "6 měsíců" — Intl handles the plural forms of each language. */
export function formatUnit(locale: Locale, value: number, unit: AgeUnit): string {
  return new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'long' }).format(value);
}

/** "12–18 years" (only the last number carries the unit). */
export function formatYears(locale: Locale, min: number, max: number): string {
  const nf = new Intl.NumberFormat(locale);
  return min === max
    ? formatUnit(locale, max, 'year')
    : `${nf.format(min)}–${formatUnit(locale, max, 'year')}`;
}

/** A real life-stage age range; `olderThan` wraps open-ended ranges ("{age} and older"). */
export function formatAge(locale: Locale, r: AgeRange, olderThan: string): string {
  if (r.to === null) return olderThan.replace('{age}', formatUnit(locale, r.from, r.unit));
  const nf = new Intl.NumberFormat(locale);
  return `${nf.format(r.from)}–${formatUnit(locale, r.to, r.unit)}`;
}
