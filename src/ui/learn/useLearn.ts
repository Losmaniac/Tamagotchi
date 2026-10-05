import { useCallback, useMemo } from 'react';
import { LEARN } from '../../i18n/learn';
import { interpolate, type Params } from '../../i18n/translate';
import { useT } from '../../i18n/useT';

/** Learning-lab texts for the active locale, plus a placeholder filler. */
export function useLearn() {
  const base = useT();
  const L = LEARN[base.locale];
  const f = useCallback(
    (template: string, params?: Params) => interpolate(base.locale, template, params),
    [base.locale],
  );
  return useMemo(() => ({ ...base, L, f }), [base, L, f]);
}
