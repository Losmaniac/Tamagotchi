import type { Locale } from '../game/save';

export type { Locale };

/** Plural forms keyed by Intl.PluralRules categories; `other` is always required. */
export type PluralMessage = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };
export type MessageValue = string | PluralMessage;

export const LOCALES: readonly Locale[] = ['en', 'cs'];
