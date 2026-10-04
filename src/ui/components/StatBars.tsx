import { LOW_STAT } from '../../game/constants';
import type { Stats, StatKey } from '../../game/types';
import { useT } from '../../i18n/useT';
import { STAT_ICON } from '../icons';

const ORDER: StatKey[] = ['hunger', 'happiness', 'energy', 'hygiene', 'health'];

function barColor(v: number): string {
  if (v < LOW_STAT) return 'bg-rose-500';
  if (v < 50) return 'bg-amber-400';
  return 'bg-emerald-400';
}

/** Five labelled stat bars with ARIA values; low stats also get a "!" marker. */
export function StatBars({ stats, dim = false }: { stats: Stats; dim?: boolean }) {
  const { t, n } = useT();
  return (
    <ul className={`grid grid-cols-5 gap-1.5 px-3 transition-opacity ${dim ? 'opacity-50' : ''}`}>
      {ORDER.map((k) => {
        const v = Math.round(stats[k]);
        const low = v < LOW_STAT;
        const label = t(`stat.${k}`);
        return (
          <li key={k} className="rounded-2xl bg-white/70 px-1.5 pt-1 pb-1.5 shadow-sm">
            <div className="flex items-center justify-between text-[11px] leading-4 font-bold text-ink/80">
              <span aria-hidden="true">{STAT_ICON[k]}</span>
              <span className={low ? 'text-rose-600' : ''}>
                {low && <span aria-hidden="true">! </span>}
                {n(v)}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={label}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={v}
              aria-valuetext={t('stats.value', { stat: label, value: v })}
              className="mt-0.5 h-2 overflow-hidden rounded-full bg-ink/10"
            >
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${barColor(v)}`}
                style={{ width: `${v}%` }}
              />
            </div>
            <div className="mt-0.5 truncate text-center text-[10px] leading-3 font-semibold text-ink/60">
              {label}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
