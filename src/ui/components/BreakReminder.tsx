import { useEffect, useState } from 'react';
import { BREAK_REMINDER } from '../../game/constants';
import { useT } from '../../i18n/useT';
import { usePageVisible } from '../hooks';

/** After 30 minutes of continuous play, suggest a break. */
export function BreakReminder({ name }: { name: string }) {
  const { t } = useT();
  const visible = usePageVisible();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!visible || show) return;
    const timer = window.setTimeout(() => setShow(true), BREAK_REMINDER);
    return () => window.clearTimeout(timer);
  }, [visible, show]);
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-5"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="break-title"
        className="anim-pop w-full max-w-sm rounded-[2rem] bg-white p-5 text-center shadow-2xl"
      >
        <p className="text-5xl" aria-hidden="true">
          🌳
        </p>
        <h2 id="break-title" className="mt-2 text-2xl font-black text-ink">
          {t('break.title')}
        </h2>
        <p className="mt-2 text-ink/80">{t('break.text', { name })}</p>
        <button
          type="button"
          autoFocus
          onClick={() => setShow(false)}
          className="mt-4 h-14 w-full rounded-2xl bg-candy-pink text-lg font-black text-white"
        >
          {t('break.ok')}
        </button>
      </section>
    </div>
  );
}
