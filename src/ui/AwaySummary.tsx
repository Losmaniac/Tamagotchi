import type { AwaySummary as Summary } from '../game/summary';
import type { StatKey } from '../game/types';
import { useT } from '../i18n/useT';
import { formatDuration } from './format';
import { STAT_ICON } from './icons';

const STATS: StatKey[] = ['hunger', 'happiness', 'energy', 'hygiene', 'health'];

/** "While you were away…" card shown after offline catch-up. */
export function AwaySummary({
  summary,
  name,
  onClose,
}: {
  summary: Summary;
  name: string;
  onClose: () => void;
}) {
  const { t, tp, n } = useT();
  const lines: string[] = [];
  if (summary.hatched) lines.push(`🐣 ${t('away.hatched', { name })}`);
  for (const e of summary.evolved)
    lines.push(
      `✨ ${t('away.evolved', { stage: t(`stage.${e.stage}`), form: t(`form.${e.form}`) })}`,
    );
  if (summary.poops) lines.push(`💩 ${tp('count.poopsDropped', summary.poops)}`);
  if (summary.gotSick) lines.push(`🤒 ${t('away.gotSick', { name })}`);
  if (summary.careMistakes) lines.push(`📵 ${tp('count.careMistakes', summary.careMistakes)}`);
  if (summary.coins) lines.push(`🪙 ${tp('count.coinsEarned', summary.coins)}`);
  if (summary.died) lines.push(`🕊️ ${t('away.died', { name })}`);
  const deltas = STATS.filter((k) => summary.statDelta[k] !== 0);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/45 p-5"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="away-title"
        className="anim-pop w-full max-w-sm rounded-[2rem] bg-white p-5 shadow-2xl"
      >
        <h2 id="away-title" className="text-2xl font-black text-ink">
          {t('away.title')}
        </h2>
        <p className="mt-1 font-semibold text-ink/70">
          {t('away.duration', { time: formatDuration(summary.to - summary.from, tp) })}
        </p>
        {deltas.length > 0 && (
          <ul className="mt-4 grid grid-cols-5 gap-1.5">
            {deltas.map((k) => {
              const d = summary.statDelta[k];
              return (
                <li
                  key={k}
                  className={`rounded-xl py-1.5 text-center ${d > 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}
                >
                  <span className="block text-lg" aria-hidden="true">
                    {STAT_ICON[k]}
                  </span>
                  <span
                    className={`block text-sm font-black ${d > 0 ? 'text-emerald-700' : 'text-rose-700'}`}
                  >
                    <span className="sr-only">{t(`stat.${k}`)} </span>
                    {d > 0 ? '▲' : '▼'} {n(Math.abs(d))}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <ul className="mt-4 space-y-1.5 font-semibold text-ink">
          {lines.length ? (
            lines.map((l) => <li key={l}>{l}</li>)
          ) : (
            <li>💤 {t('away.nothing', { name })}</li>
          )}
        </ul>
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="mt-5 h-14 w-full rounded-2xl bg-candy-pink text-lg font-black text-white shadow-md active:scale-[0.98]"
        >
          {t('common.gotIt')}
        </button>
      </section>
    </div>
  );
}
