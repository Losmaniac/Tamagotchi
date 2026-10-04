import { LOCALES } from '../../i18n/types';
import { useT } from '../../i18n/useT';
import { useAppStore } from '../../store/useAppStore';

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { t, locale } = useT();
  const setLocale = useAppStore((s) => s.setLocale);
  return (
    <div
      role="group"
      aria-label={t('settings.language')}
      className="flex w-fit gap-1 rounded-full bg-white/70 p-1 shadow-sm"
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          lang={l}
          className={`min-h-12 min-w-12 rounded-full px-3 text-sm font-bold transition ${
            locale === l ? 'bg-candy-pink text-white shadow' : 'text-ink/70'
          }`}
        >
          {compact ? l.toUpperCase() : t(`lang.${l}`)}
        </button>
      ))}
    </div>
  );
}
