import type { MessageValue, PluralMessage } from './types';

export const en = {
  'app.name': 'Pocket Pals',
  'app.tagline': 'Hatch it. Raise it. Don’t let it down.',
  'app.comingSoon': 'Your egg is on its way…',
  'app.offlineReady': 'Ready to play offline',
  'settings.language': 'Language',
  'lang.en': 'English',
  'lang.cs': 'Čeština',
  'egg.hatchesIn': 'Hatches in {time}',
  'count.minutes': { one: '{count} minute', other: '{count} minutes' },
  'count.days': { one: '{count} day', other: '{count} days' },
  'count.coins': { one: '{count} coin', other: '{count} coins' },
  'count.poops': { one: '{count} poop', other: '{count} poops' },
} satisfies Record<string, MessageValue>;

type Source = typeof en;
export type MessageKey = keyof Source;
export type StringKey = { [K in MessageKey]: Source[K] extends string ? K : never }[MessageKey];
export type PluralKey = Exclude<MessageKey, StringKey>;

/** Every locale must provide every key; a missing translation fails the type check. */
export type Messages = { [K in MessageKey]: Source[K] extends string ? string : PluralMessage };
