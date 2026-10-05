import { careTotal, feelingOf, type CareKind, type Feeling } from '../../game/diary';
import { useT } from '../../i18n/useT';
import { useAppStore } from '../../store/useAppStore';
import { Sheet } from '../components/Sheet';
import { shareOrDownload } from '../photo';

const FEELING_ICON: Record<Feeling, string> = {
  happy: '😊',
  content: '🙂',
  lonely: '🥺',
  sleepy: '😴',
  hungry: '😋',
  sick: '🤒',
};
const CARE_ICON: Record<CareKind, string> = {
  meal: '🍱',
  snack: '🍪',
  play: '🎾',
  clean: '🧽',
  medicine: '💊',
  stroke: '🤲',
  scold: '📏',
};

/** Weekly reflection: what went well, what was missing, and how the pet probably felt. */
export function DiarySheet({ onClose }: { onClose: () => void }) {
  const { t, tp, n, locale } = useT();
  const diary = useAppStore((s) => s.game.diary);
  const exportSave = useAppStore((s) => s.exportSave);
  const date = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
  });
  const days = [...diary].reverse().slice(0, 7);

  const share = () => {
    const file = new File([exportSave()], 'pocketpals-save.json', { type: 'application/json' });
    void shareOrDownload(file);
  };

  return (
    <Sheet title={`📔 ${t('diary.title')}`} onClose={onClose} full>
      {days.length === 0 ? (
        <p className="py-6 text-center text-ink/60">{t('diary.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {days.map((d) => {
            const feeling = feelingOf(d);
            const [y, m, dd] = d.day.split('-').map(Number);
            const care = (Object.entries(d.care) as [CareKind, number][]).filter(([, v]) => v > 0);
            return (
              <li key={d.day} className="rounded-2xl bg-amber-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black text-ink capitalize">
                    {date.format(new Date(y!, (m ?? 1) - 1, dd))}
                  </p>
                  <p className="text-sm font-bold text-ink/70">
                    {t('diary.feltLike')} <span aria-hidden="true">{FEELING_ICON[feeling]}</span>{' '}
                    {t(`feeling.${feeling}`)}
                  </p>
                </div>
                {care.length > 0 && (
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {care.map(([k, v]) => (
                      <span key={k} className="mr-3 inline-block">
                        <span aria-hidden="true">{CARE_ICON[k]}</span> {n(v)}
                      </span>
                    ))}
                  </p>
                )}
                <ul className="mt-1 space-y-0.5 text-sm text-ink/80">
                  {d.wellRested && <li>✅ {t('diary.wellRested')}</li>}
                  {d.missedCalls > 0 && <li>📵 {tp('count.careMistakes', d.missedCalls)}</li>}
                  {d.sick && <li>🤒 {t('diary.sick')}</li>}
                  {careTotal(d) < 3 && <li>💭 {t('diary.noCare')}</li>}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
      <section className="mt-4 mb-4 rounded-2xl bg-sky-50 p-3">
        <h3 className="font-black text-ink">🤝 {t('diary.share')}</h3>
        <p className="mt-1 text-sm text-ink/70">{t('diary.shareText')}</p>
        <button
          type="button"
          onClick={share}
          className="mt-2 min-h-12 rounded-xl bg-candy-purple px-4 font-black text-white"
        >
          📤 {t('diary.shareButton')}
        </button>
      </section>
    </Sheet>
  );
}
