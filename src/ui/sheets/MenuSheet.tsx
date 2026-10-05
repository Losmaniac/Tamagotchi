import { useT } from '../../i18n/useT';
import { Sheet } from '../components/Sheet';

export type HubTarget =
  'learn' | 'encyclopedia' | 'bank' | 'diary' | 'album' | 'achievements' | 'memorial' | 'settings';

/** "Pal hub": everything that isn't a direct care action. */
export function MenuSheet({
  onClose,
  onOpen,
}: {
  onClose: () => void;
  onOpen: (t: HubTarget) => void;
}) {
  const { t } = useT();
  const items: { id: HubTarget; icon: string; label: string; tint: string }[] = [
    { id: 'learn', icon: '🔬', label: t('menu.learn'), tint: 'bg-emerald-50' },
    { id: 'encyclopedia', icon: '📚', label: t('menu.encyclopedia'), tint: 'bg-sky-50' },
    { id: 'bank', icon: '🐷', label: t('menu.bank'), tint: 'bg-pink-50' },
    { id: 'diary', icon: '📔', label: t('menu.diary'), tint: 'bg-amber-50' },
    { id: 'album', icon: '🖼️', label: t('menu.album'), tint: 'bg-violet-50' },
    { id: 'achievements', icon: '🏅', label: t('ach.title'), tint: 'bg-yellow-50' },
    { id: 'memorial', icon: '🪦', label: t('memorial.title'), tint: 'bg-indigo-50' },
    { id: 'settings', icon: '⚙️', label: t('settings.title'), tint: 'bg-ink/5' },
  ];
  return (
    <Sheet title={t('menu.title')} onClose={onClose}>
      <ul className="grid grid-cols-2 gap-2 pb-3">
        {items.map((it) => (
          <li key={it.id}>
            <button
              type="button"
              onClick={() => onOpen(it.id)}
              className={`flex min-h-20 w-full flex-col items-center justify-center gap-1 rounded-2xl ${it.tint} font-black text-ink active:scale-95`}
            >
              <span className="text-3xl" aria-hidden="true">
                {it.icon}
              </span>
              {it.label}
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
