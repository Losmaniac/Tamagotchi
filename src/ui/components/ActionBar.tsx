import { useT } from '../../i18n/useT';

export type ActionId = 'feed' | 'play' | 'clean' | 'lights' | 'medicine' | 'stats';

interface ActionBarProps {
  onAction: (id: ActionId) => void;
  disabled: Partial<Record<ActionId, boolean>>;
  highlight: Partial<Record<ActionId, boolean>>;
  lightsOn: boolean;
}

/** Bottom action bar: six large, thumb-friendly buttons. */
export function ActionBar({ onAction, disabled, highlight, lightsOn }: ActionBarProps) {
  const { t } = useT();
  const items: { id: ActionId; icon: string; label: string }[] = [
    { id: 'feed', icon: '🍙', label: t('action.feed') },
    { id: 'play', icon: '🎾', label: t('action.play') },
    { id: 'clean', icon: '🧽', label: t('action.clean') },
    { id: 'lights', icon: lightsOn ? '💡' : '🌙', label: t('action.lights') },
    { id: 'medicine', icon: '💊', label: t('action.medicine') },
    { id: 'stats', icon: '📊', label: t('action.stats') },
  ];
  return (
    <nav
      aria-label={t('a11y.actions')}
      className="grid grid-cols-6 gap-1.5 px-2 pt-2"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      {items.map(({ id, icon, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onAction(id)}
          disabled={disabled[id]}
          aria-pressed={id === 'lights' ? !lightsOn : undefined}
          className={`relative flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl bg-white/85 shadow-md transition active:scale-95 disabled:opacity-40 ${
            highlight[id] ? 'ring-4 ring-rose-400' : ''
          }`}
        >
          <span
            className={`text-2xl leading-none ${highlight[id] ? 'anim-wiggle' : ''}`}
            aria-hidden="true"
          >
            {icon}
          </span>
          <span className="max-w-full truncate text-[10px] font-bold tracking-tight text-ink/80">
            {label}
          </span>
          {highlight[id] && (
            <span
              className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-rose-600 text-[11px] font-black text-white"
              aria-hidden="true"
            >
              !
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
