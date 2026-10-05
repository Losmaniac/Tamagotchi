import { useT } from '../../i18n/useT';
import type { PetAction } from '../../store/useAppStore';
import { SNACKS } from '../../game/food';
import { useAppStore } from '../../store/useAppStore';
import { Sheet } from '../components/Sheet';

export function MenuButton({
  icon,
  title,
  desc,
  onClick,
  disabled,
}: {
  icon: string;
  title: string;
  desc: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-16 w-full items-center gap-4 rounded-2xl bg-candy-pink/10 px-4 py-3 text-left transition active:scale-[0.98] disabled:opacity-40"
    >
      <span className="text-4xl" aria-hidden="true">
        {icon}
      </span>
      <span>
        <span className="block text-lg font-black text-ink">{title}</span>
        <span className="block text-sm font-semibold text-ink/60">{desc}</span>
      </span>
    </button>
  );
}

export function FeedSheet({
  onClose,
  onAction,
}: {
  onClose: () => void;
  onAction: (a: PetAction) => void;
}) {
  const { t } = useT();
  const feedSnack = useAppStore((s) => s.feedSnack);
  const species = useAppStore((s) => s.game.pet?.species);
  const favorites = useAppStore((s) => s.game.progress.favorites);
  const found = species ? favorites[species] : undefined;
  return (
    <Sheet title={t('feed.title')} onClose={onClose}>
      <div className="space-y-3 pb-2">
        <MenuButton
          icon="🍱"
          title={t('feed.meal')}
          desc={t('feed.mealDesc')}
          onClick={() => {
            onAction('meal');
            onClose();
          }}
        />
        <h3 className="pt-1 text-sm font-black tracking-wide text-ink/50 uppercase">
          {t('feed.snacks')}
        </h3>
        <ul className="grid grid-cols-3 gap-2">
          {SNACKS.map((snack) => (
            <li key={snack.id}>
              <button
                type="button"
                onClick={() => {
                  feedSnack(snack.id);
                  onClose();
                }}
                className={`relative flex min-h-20 w-full flex-col items-center justify-center rounded-2xl px-1 py-2 active:scale-95 ${
                  snack.sweet ? 'bg-pink-50' : 'bg-emerald-50'
                }`}
              >
                <span className="text-3xl" aria-hidden="true">
                  {snack.emoji}
                </span>
                <span className="text-xs font-black text-ink">{t(`snack.${snack.id}`)}</span>
                <span
                  className={`text-[10px] font-bold ${snack.sweet ? 'text-pink-700' : 'text-emerald-700'}`}
                >
                  {snack.sweet ? t('feed.sweet') : t('feed.healthy')}
                </span>
                {found === snack.id && (
                  <span
                    className="absolute top-1 right-1 text-sm"
                    title={t('feed.favorite')}
                    aria-label={t('feed.favorite')}
                  >
                    ❤️
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink/60">💡 {t('feed.mealsTip')}</p>
      </div>
    </Sheet>
  );
}
