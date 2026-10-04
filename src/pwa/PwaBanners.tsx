import { useT } from '../i18n/useT';
import { useAppStore } from '../store/useAppStore';
import { useInstallPrompt } from './install';
import { usePwaStore } from './registerSW';

/** "New version — tap to refresh". */
export function UpdateToast() {
  const { t } = useT();
  const needRefresh = usePwaStore((s) => s.needRefresh);
  if (!needRefresh) return null;
  return (
    <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="anim-pop min-h-12 rounded-full bg-candy-purple px-5 font-black text-white shadow-xl"
      >
        ✨ {t('pwa.update')}
      </button>
    </div>
  );
}

/**
 * Early install nudge: installed PWAs keep their storage (Safari may wipe data of
 * sites not used for 7 days). Android gets a real Install button, iOS a short hint.
 */
export function InstallBanner() {
  const { t } = useT();
  const { canPrompt, standalone, ios, prompt } = useInstallPrompt();
  const dismissed = useAppStore((s) => s.settings.installHintDismissed);
  const update = useAppStore((s) => s.updateSettings);
  if (standalone || dismissed || (!canPrompt && !ios)) return null;
  const dismiss = () => update({ installHintDismissed: true });
  return (
    <div
      role="note"
      className="anim-pop mx-3 mt-2 flex items-start gap-2 rounded-2xl bg-white/90 py-1.5 pr-1 pl-3 shadow-md"
    >
      <p className="flex-1 py-1 text-xs leading-snug font-semibold text-ink">
        📲 {t('pwa.installHint')}{' '}
        {ios && !canPrompt && (
          <span className="font-black text-candy-purple">{t('pwa.iosHint')} </span>
        )}
        <span className="text-ink/60">{t('pwa.exportTip')}</span>
      </p>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <button
          type="button"
          onClick={dismiss}
          className="flex size-11 items-center justify-center rounded-full text-xl font-bold text-ink/50"
          aria-label={t('pwa.dismiss')}
        >
          ×
        </button>
        {canPrompt && (
          <button
            type="button"
            onClick={() => void prompt().then((ok) => ok && dismiss())}
            className="min-h-11 rounded-xl bg-candy-pink px-3 text-sm font-black text-white"
          >
            {t('pwa.install')}
          </button>
        )}
      </div>
    </div>
  );
}

/** Install button for the settings sheet (hidden when installed / unsupported). */
export function InstallSetting() {
  const { t } = useT();
  const { canPrompt, standalone, ios, prompt } = useInstallPrompt();
  if (standalone) return null;
  if (canPrompt)
    return (
      <button
        type="button"
        onClick={() => void prompt()}
        className="mt-2 min-h-12 w-full rounded-xl bg-candy-pink/15 font-bold text-ink"
      >
        📲 {t('settings.install')}
      </button>
    );
  if (ios)
    return <p className="mt-2 text-sm font-semibold text-candy-purple">📲 {t('pwa.iosHint')}</p>;
  return null;
}
