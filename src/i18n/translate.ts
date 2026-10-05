import { cs } from './cs';
import { en, type Messages, type PluralKey, type StringKey } from './en';
import type { Locale, PluralMessage } from './types';

export const dictionaries: Record<Locale, Messages> = { en, cs };

export type Params = Record<string, string | number>;

/** Anything starting with `cs` → Czech, otherwise English. */
export function detectLocale(languages: readonly string[] | undefined): Locale {
  const first = languages?.[0]?.toLowerCase() ?? '';
  return first.startsWith('cs') ? 'cs' : 'en';
}

export function formatNumber(locale: Locale, n: number): string {
  return new Intl.NumberFormat(locale).format(n);
}

/** Fills `{name}` placeholders (numbers are locale-formatted). */
export function interpolate(locale: Locale, template: string, params: Params = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    if (value === undefined) return match;
    return typeof value === 'number' ? formatNumber(locale, value) : value;
  });
}

const pluralRulesCache = new Map<Locale, Intl.PluralRules>();
function pluralRules(locale: Locale): Intl.PluralRules {
  let rules = pluralRulesCache.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale);
    pluralRulesCache.set(locale, rules);
  }
  return rules;
}

export function translate(locale: Locale, key: StringKey, params?: Params): string {
  return interpolate(locale, dictionaries[locale][key], params);
}

export function translatePlural(
  locale: Locale,
  key: PluralKey,
  count: number,
  params?: Params,
): string {
  const forms: PluralMessage = dictionaries[locale][key];
  const category = pluralRules(locale).select(count);
  const template = forms[category] ?? forms.other;
  return interpolate(locale, template, { count, ...params });
}
