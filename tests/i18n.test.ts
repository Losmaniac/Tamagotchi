import { describe, expect, it } from 'vitest';
import { cs } from '../src/i18n/cs';
import { en } from '../src/i18n/en';
import { detectLocale, translate, translatePlural } from '../src/i18n/translate';

describe('detectLocale', () => {
  it('maps any cs-* language to Czech', () => {
    expect(detectLocale(['cs'])).toBe('cs');
    expect(detectLocale(['cs-CZ', 'en'])).toBe('cs');
    expect(detectLocale(['CS-cz'])).toBe('cs');
  });

  it('falls back to English', () => {
    expect(detectLocale(['de-DE', 'cs'])).toBe('en');
    expect(detectLocale([])).toBe('en');
    expect(detectLocale(undefined)).toBe('en');
  });
});

describe('translate', () => {
  it('returns strings for the active locale', () => {
    expect(translate('en', 'settings.language')).toBe('Language');
    expect(translate('cs', 'settings.language')).toBe('Jazyk');
  });

  it('interpolates params and leaves unknown placeholders intact', () => {
    expect(translate('en', 'egg.hatchesIn', { time: 'soon' })).toBe('Hatches in soon');
    expect(translate('en', 'egg.hatchesIn')).toBe('Hatches in {time}');
  });
});

describe('translatePlural', () => {
  it('handles English one/other', () => {
    expect(translatePlural('en', 'count.days', 1)).toBe('1 day');
    expect(translatePlural('en', 'count.days', 2)).toBe('2 days');
    expect(translatePlural('en', 'count.days', 0)).toBe('0 days');
  });

  it('handles Czech 1 / 2–4 / 5+ forms', () => {
    expect(translatePlural('cs', 'count.days', 1)).toBe('1 den');
    expect(translatePlural('cs', 'count.days', 3)).toBe('3 dny');
    expect(translatePlural('cs', 'count.days', 5)).toBe('5 dní');
    expect(translatePlural('cs', 'count.poops', 4)).toBe('4 hovínka');
    expect(translatePlural('cs', 'count.poops', 12)).toBe('12 hovínek');
  });

  it('formats counts with the locale number format', () => {
    expect(translatePlural('en', 'count.coins', 1500)).toBe('1,500 coins');
    // Czech groups thousands with a no-break space.
    expect(translatePlural('cs', 'count.coins', 1500).replace(/\s/g, ' ')).toBe('1 500 mincí');
  });
});

describe('dictionaries', () => {
  it('have identical keys in every locale', () => {
    expect(Object.keys(cs).sort()).toEqual(Object.keys(en).sort());
  });
});
