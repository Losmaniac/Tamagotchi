import { ACHIEVEMENTS } from '../../game/achievements';
import type { StringKey } from '../../i18n/en';
import { useT } from '../../i18n/useT';
import { useAppStore } from '../../store/useAppStore';
import { Sheet } from '../components/Sheet';

export function AchievementsSheet({ onClose }: { onClose: () => void }) {
  const { t, n, locale } = useT();
  const unlocked = useAppStore((s) => s.game.achievements);
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
  const done = ACHIEVEMENTS.filter((a) => unlocked[a.id] !== undefined).length;
  return (
    <Sheet title={`🏅 ${t('ach.title')}`} onClose={onClose} full>
      <p className="mb-3 font-bold text-ink/60">
        {t('ach.progress', { done: n(done), total: n(ACHIEVEMENTS.length) })}
      </p>
      <ul className="grid grid-cols-1 gap-2 pb-4">
        {ACHIEVEMENTS.map((a) => {
          const at = unlocked[a.id];
          const got = at !== undefined;
          return (
            <li
              key={a.id}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${got ? 'bg-amber-50' : 'bg-ink/5'}`}
            >
              <span className={`text-3xl ${got ? '' : 'opacity-40 grayscale'}`} aria-hidden="true">
                {a.icon}
              </span>
              <div className="flex-1">
                <p className="font-black text-ink">
                  {t(`ach.${a.id}.name` as StringKey)}
                  <span className="sr-only">{got ? ' ✓' : ''}</span>
                </p>
                <p className="text-sm text-ink/60">{t(`ach.${a.id}.desc` as StringKey)}</p>
              </div>
              {got ? (
                <span className="text-right text-xs font-bold text-amber-700">
                  ✓<br />
                  {date.format(at)}
                </span>
              ) : (
                <span className="text-lg text-ink/30" aria-hidden="true">
                  🔒
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
