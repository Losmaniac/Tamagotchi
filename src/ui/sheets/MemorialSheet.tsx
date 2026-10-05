import type { MemorialEntry } from '../../game/types';
import { useT } from '../../i18n/useT';
import { Sheet } from '../components/Sheet';
import { formatDuration } from '../format';
import { SPECIES_ICON } from '../icons';

export function MemorialSheet({
  entries,
  onClose,
  onAlbum,
}: {
  entries: MemorialEntry[];
  onClose: () => void;
  onAlbum?: (entry: MemorialEntry) => void;
}) {
  const { t, tp, locale } = useT();
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
  return (
    <Sheet title={`🪦 ${t('memorial.title')}`} onClose={onClose} full>
      {entries.length === 0 ? (
        <p className="py-8 text-center font-semibold text-ink/60">{t('memorial.empty')}</p>
      ) : (
        <ul className="space-y-2 pb-4">
          {entries.map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-indigo-50 px-3 py-3">
              <span className="text-3xl grayscale-[40%]" aria-hidden="true">
                {SPECIES_ICON[m.species]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-black text-ink">{m.name}</p>
                <p className="text-sm font-semibold text-ink/60">
                  {t(`species.${m.species}`)} · {t(`stage.${m.stage}`)} · {t(`form.${m.form}`)}
                </p>
                <p className="text-sm text-ink/70">
                  {t(`death.cause.${m.cause}`)} ·{' '}
                  {t('memorial.lived', { time: formatDuration(m.age, tp, 'acc') })}
                </p>
              </div>
              {onAlbum && (
                <button
                  type="button"
                  onClick={() => onAlbum(m)}
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm"
                  aria-label={`${t('memorial.album')}: ${m.name}`}
                >
                  🖼️
                </button>
              )}
              <time
                className="text-xs font-semibold text-ink/50"
                dateTime={new Date(m.diedAt).toISOString()}
              >
                {date.format(m.diedAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
