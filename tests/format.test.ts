import { describe, expect, it } from 'vitest';
import { DAY, HOUR, MINUTE } from '../src/game/constants';
import { translatePlural } from '../src/i18n/translate';
import { formatClockDuration, formatDuration } from '../src/ui/format';

const tpEn = (k: Parameters<typeof translatePlural>[1], n: number) => translatePlural('en', k, n);
const tpCs = (k: Parameters<typeof translatePlural>[1], n: number) => translatePlural('cs', k, n);

describe('formatDuration', () => {
  it('uses the two largest units', () => {
    expect(formatDuration(2 * DAY + 3 * HOUR + 5 * MINUTE, tpEn)).toBe('2 days 3 hours');
    expect(formatDuration(3 * HOUR + 5 * MINUTE, tpEn)).toBe('3 hours 5 minutes');
    expect(formatDuration(45_000, tpEn)).toBe('45 seconds');
    expect(formatDuration(0, tpEn)).toBe('0 seconds');
    expect(formatDuration(300, tpEn)).toBe('1 second');
  });

  it('declines Czech by grammatical case', () => {
    expect(formatDuration(HOUR, tpCs)).toBe('1 hodina');
    expect(formatDuration(HOUR, tpCs, 'acc')).toBe('1 hodinu');
    expect(formatDuration(2 * DAY + 4 * HOUR, tpCs)).toBe('2 dny 4 hodiny');
    expect(formatDuration(5 * MINUTE, tpCs, 'acc')).toBe('5 minut');
  });
});

describe('formatClockDuration', () => {
  it('formats m:ss and h:mm:ss', () => {
    expect(formatClockDuration(4 * MINUTE + 5_000)).toBe('4:05');
    expect(formatClockDuration(HOUR + 2 * MINUTE + 3_000)).toBe('1:02:03');
    expect(formatClockDuration(-5)).toBe('0:00');
  });
});
