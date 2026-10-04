import { useEffect, useState } from 'react';
import { useT } from '../i18n/useT';
import { LOCALES } from '../i18n/types';
import { setupServiceWorker } from '../pwa/registerSW';
import { useAppStore } from '../store/useAppStore';

// Milestone 1 shell: proves layout, i18n and offline caching. Game screens come later.
export function App() {
  const { t, tp, locale } = useT();
  const setLocale = useAppStore((s) => s.setLocale);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => setupServiceWorker(() => setOfflineReady(true)), []);

  return (
    <main className="safe-area flex h-full flex-col items-center justify-between bg-gradient-to-b from-pink-200 via-fuchsia-100 to-violet-200 text-center">
      <header className="w-full px-4 pt-4">
        <div
          role="group"
          aria-label={t('settings.language')}
          className="ml-auto flex w-fit gap-1 rounded-full bg-white/60 p-1 shadow-sm"
        >
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLocale(l)}
              aria-pressed={locale === l}
              className={`min-h-12 min-w-12 rounded-full px-4 text-sm font-bold transition ${
                locale === l ? 'bg-candy-pink text-white shadow' : 'text-ink/70'
              }`}
            >
              {t(`lang.${l}`)}
            </button>
          ))}
        </div>
      </header>

      <section className="flex flex-col items-center gap-4 px-4">
        <img
          src={`${import.meta.env.BASE_URL}icons/icon.svg`}
          alt=""
          width={160}
          height={160}
          className="rounded-[2.5rem] shadow-xl"
        />
        <h1 className="text-5xl font-black tracking-tight text-ink">{t('app.name')}</h1>
        <p className="text-lg font-semibold text-balance text-ink/80">{t('app.tagline')}</p>
        <p className="rounded-3xl bg-white/70 px-5 py-2 font-bold text-balance text-candy-purple">
          {t('app.comingSoon')} · {t('egg.hatchesIn', { time: tp('count.minutes', 5) })}
        </p>
      </section>

      <footer className="px-4 pb-6 text-sm font-semibold text-ink/60" aria-live="polite">
        {offlineReady ? `✓ ${t('app.offlineReady')}` : ' '}
      </footer>
    </main>
  );
}
