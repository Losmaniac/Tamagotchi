import { useEffect, useState } from 'react';
import { BIRTHDAY_COINS } from '../../game/constants';
import { useT } from '../../i18n/useT';
import { PHRASES } from '../../i18n/vocab';
import { useAppStore } from '../../store/useAppStore';
import { formatDuration } from '../format';

/** Little celebration banners: welcome back, birthdays, perfect days, good nights. */
export function JoyToast() {
  const { t, tp, n } = useT();
  const joy = useAppStore((s) => s.joy);
  const name = useAppStore((s) => s.game.pet?.name ?? '');
  const [hidden, setHidden] = useState<number | null>(null);
  useEffect(() => {
    if (!joy) return;
    const timer = window.setTimeout(() => setHidden(joy.id), 4200);
    return () => window.clearTimeout(timer);
  }, [joy]);
  if (!joy || joy.id === hidden) return null;
  const text =
    joy.kind === 'birthday'
      ? t('joy.birthday', {
          name,
          age: formatDuration((joy.days ?? 1) * 86_400_000, tp),
          coins: n(BIRTHDAY_COINS[joy.days ?? 1] ?? 0),
        })
      : t(`joy.${joy.kind}`, { name });
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-4">
      <p
        key={joy.id}
        role="status"
        className="anim-pop rounded-2xl bg-white/95 px-4 py-2 text-center font-black text-ink shadow-lg ring-4 ring-candy-yellow"
      >
        {text}
      </p>
    </div>
  );
}

/** Speech bubble above the pet; in bilingual mode it also shows the other language. */
export function SpeechBubble() {
  const { locale } = useT();
  const speech = useAppStore((s) => s.speech);
  const bilingual = useAppStore((s) => s.settings.bilingual);
  const [hidden, setHidden] = useState<number | null>(null);
  useEffect(() => {
    if (!speech) return;
    const timer = window.setTimeout(() => setHidden(speech.id), 2600);
    return () => window.clearTimeout(timer);
  }, [speech]);
  if (!speech || speech.id === hidden) return null;
  const phrase = PHRASES[speech.phrase];
  const other = locale === 'cs' ? 'en' : 'cs';
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-[18%] z-10 flex justify-center"
      aria-live="polite"
    >
      <div
        key={speech.id}
        className="anim-pop relative rounded-2xl bg-white px-4 py-2 text-center shadow-lg"
      >
        {bilingual ? (
          <>
            <p className="text-lg font-black text-candy-purple" lang={other}>
              {phrase[other]}
            </p>
            <p className="text-xs font-semibold text-ink/60">{phrase[locale]}</p>
          </>
        ) : (
          <p className="text-lg font-black text-ink">{phrase[locale]}</p>
        )}
        <span
          className="absolute -bottom-2 left-1/2 size-4 -translate-x-1/2 rotate-45 bg-white"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
