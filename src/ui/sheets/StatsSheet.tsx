import { petAge } from '../../game/death';
import { timeToNextStage } from '../../game/status';
import type { LogEntry, Pet, StatKey } from '../../game/types';
import type { StringKey } from '../../i18n/en';
import { useT } from '../../i18n/useT';
import { Sheet } from '../components/Sheet';
import { formatDuration } from '../format';
import { useNow } from '../hooks';
import { STAT_ICON, SPECIES_ICON } from '../icons';

const STATS: StatKey[] = ['hunger', 'happiness', 'energy', 'hygiene', 'health'];
const LOG_ICON: Record<LogEntry['type'], string> = {
  hatched: '🐣',
  evolved: '✨',
  poop: '💩',
  sick: '🤒',
  cured: '💊',
  fellAsleep: '😴',
  wokeUp: '🌅',
  careMistake: '📵',
  actedUp: '😤',
  died: '🕊️',
  coins: '🪙',
};

export function StatsSheet({
  pet,
  log,
  onClose,
}: {
  pet: Pet;
  log: LogEntry[];
  onClose: () => void;
}) {
  const { t, tp, n, locale } = useT();
  const now = useNow(30_000);
  const time = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const rows: [string, string][] = [
    [t('stats.stage'), t(`stage.${pet.stage}`)],
    [t('stats.form'), t(`form.${pet.form}`)],
    [t('stats.age'), formatDuration(petAge(pet, now), tp)],
    [t('stats.nextStage'), pet.dead ? '—' : formatDuration(timeToNextStage(pet, now), tp, 'acc')],
    [t('stats.careMistakes'), n(pet.totalCareMistakes)],
  ];
  return (
    <Sheet title={t('stats.title')} onClose={onClose} full>
      <div className="mb-3 flex items-center gap-3">
        <span className="text-4xl" aria-hidden="true">
          {SPECIES_ICON[pet.species]}
        </span>
        <div>
          <p className="text-2xl font-black text-ink">{pet.name}</p>
          <p className="font-semibold text-ink/60">{t(`species.${pet.species}`)}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-2">
        {rows.map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-violet-50 px-3 py-2">
            <dt className="text-xs font-bold text-ink/60">{k}</dt>
            <dd className="font-black text-ink">{v}</dd>
          </div>
        ))}
        <div className="col-span-2 rounded-2xl bg-violet-50 px-3 py-2">
          <dt className="text-xs font-bold text-ink/60">{t('stats.discipline')}</dt>
          <dd className="mt-1 flex items-center gap-2">
            <div
              className="h-3 flex-1 overflow-hidden rounded-full bg-ink/10"
              role="progressbar"
              aria-label={t('stats.discipline')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pet.discipline}
            >
              <div
                className="h-full rounded-full bg-candy-purple"
                style={{ width: `${pet.discipline}%` }}
              />
            </div>
            <span className="w-10 text-right font-black text-ink">{n(pet.discipline)}</span>
          </dd>
        </div>
      </dl>
      <ul className="mt-3 space-y-1.5">
        {STATS.map((k) => (
          <li key={k} className="flex items-center gap-2 font-semibold text-ink">
            <span aria-hidden="true">{STAT_ICON[k]}</span>
            <span className="flex-1">{t(`stat.${k}`)}</span>
            <span className="font-black">{n(Math.round(pet.stats[k]))} / 100</span>
          </li>
        ))}
      </ul>
      <h3 className="mt-5 mb-2 text-lg font-black text-ink">{t('stats.log')}</h3>
      {log.length === 0 ? (
        <p className="text-ink/60">{t('stats.logEmpty')}</p>
      ) : (
        <ul className="space-y-1 pb-4">
          {[...log]
            .reverse()
            .slice(0, 25)
            .map((e, i) => (
              <li key={`${e.t}-${i}`} className="flex items-center gap-2 text-sm text-ink">
                <span aria-hidden="true">{LOG_ICON[e.type]}</span>
                <span className="flex-1 font-semibold">{t(`log.${e.type}` as StringKey)}</span>
                <time className="text-ink/50" dateTime={new Date(e.t).toISOString()}>
                  {time.format(e.t)}
                </time>
              </li>
            ))}
        </ul>
      )}
    </Sheet>
  );
}
