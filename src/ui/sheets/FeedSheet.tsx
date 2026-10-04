import { useT } from '../../i18n/useT';
import type { PetAction } from '../../store/useAppStore';
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
  const pick = (a: PetAction) => {
    onAction(a);
    onClose();
  };
  return (
    <Sheet title={t('feed.title')} onClose={onClose}>
      <div className="space-y-3 pb-2">
        <MenuButton
          icon="🍱"
          title={t('feed.meal')}
          desc={t('feed.mealDesc')}
          onClick={() => pick('meal')}
        />
        <MenuButton
          icon="🍪"
          title={t('feed.snack')}
          desc={t('feed.snackDesc')}
          onClick={() => pick('snack')}
        />
      </div>
    </Sheet>
  );
}
