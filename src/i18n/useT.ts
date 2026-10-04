import { useCallback, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { PluralKey, StringKey } from './en';
import { formatNumber, translate, translatePlural, type Params } from './translate';

/** Returns translation helpers bound to the active locale; re-renders on locale change. */
export function useT() {
  const locale = useAppStore((s) => s.settings.locale);
  const t = useCallback(
    (key: StringKey, params?: Params) => translate(locale, key, params),
    [locale],
  );
  const tp = useCallback(
    (key: PluralKey, count: number, params?: Params) => translatePlural(locale, key, count, params),
    [locale],
  );
  const n = useCallback((value: number) => formatNumber(locale, value), [locale]);
  return useMemo(() => ({ t, tp, n, locale }), [t, tp, n, locale]);
}
