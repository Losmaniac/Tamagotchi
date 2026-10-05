import { useEffect, useState } from 'react';
import { ACHIEVEMENTS } from '../../game/achievements';
import type { StringKey } from '../../i18n/en';
import { useT } from '../../i18n/useT';
import { onStorageFailure } from '../../store/safeStorage';
import { useAppStore, type Feedback } from '../../store/useAppStore';

function feedbackKey(f: Feedback, lightsOn: boolean): StringKey | null {
  if (f.outcome === 'asleep') return 'outcome.asleep';
  if (f.outcome === 'egg') return 'outcome.egg';
  if (f.outcome === 'tired') return 'outcome.tooTired';
  switch (f.action) {
    case 'meal':
      return f.outcome === 'refused'
        ? 'outcome.refused'
        : f.outcome === 'full'
          ? 'outcome.full'
          : null;
    case 'snack':
      return f.outcome === 'gotSick'
        ? 'outcome.gotSick'
        : f.outcome === 'favorite'
          ? 'outcome.favorite'
          : null;
    case 'clean':
      return f.outcome === 'ok' ? 'outcome.cleaned' : null;
    case 'lights':
      return f.outcome === 'ok' ? (lightsOn ? 'outcome.lightsOn' : 'outcome.lightsOff') : null;
    case 'medicine':
      return f.outcome === 'cured'
        ? 'outcome.cured'
        : f.outcome === 'notSick'
          ? 'outcome.notSick'
          : 'outcome.medicineMore';
    case 'scold':
      return f.outcome === 'ok'
        ? 'outcome.scolded'
        : f.outcome === 'unfair'
          ? 'outcome.unfair'
          : null;
    case 'wake':
      return f.outcome === 'ok' ? 'outcome.woke' : null;
    case 'buy':
      return f.outcome === 'poor' ? 'shop.poor' : f.outcome === 'ok' ? 'shop.bought' : null;
    default:
      return null;
  }
}

/** Short-lived message after an action (e.g. "Shh… Mochi is sleeping."). */
export function FeedbackToast() {
  const { t } = useT();
  const feedback = useAppStore((s) => s.feedback);
  const pet = useAppStore((s) => s.game.pet);
  const [dismissed, setDismissed] = useState<number | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setDismissed(feedback.id), 2600);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const key =
    feedback && feedback.id !== dismissed ? feedbackKey(feedback, pet?.lightsOn ?? true) : null;
  const item = feedback?.detail ? t(`item.${feedback.detail}` as StringKey) : '';
  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center px-4"
    >
      {key && feedback && (
        <div
          key={feedback.id}
          className="anim-pop rounded-full bg-ink/85 px-4 py-2 text-center text-sm font-bold text-white shadow-lg"
        >
          {t(key, { name: pet?.name ?? '', item })}
        </div>
      )}
    </div>
  );
}

/** Queued "Achievement unlocked!" pop-ups, one at a time. */
export function AchievementToast() {
  const { t } = useT();
  const next = useAppStore((s) => s.achievementQueue[0]);
  const shift = useAppStore((s) => s.shiftAchievement);
  useEffect(() => {
    if (!next) return;
    const timer = window.setTimeout(shift, 3200);
    return () => window.clearTimeout(timer);
  }, [next, shift]);
  if (!next) return null;
  const a = ACHIEVEMENTS.find((x) => x.id === next);
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
    >
      <div
        key={next}
        role="status"
        className="anim-pop flex items-center gap-3 rounded-2xl bg-white px-4 py-2 shadow-xl ring-4 ring-candy-yellow"
      >
        <span className="text-3xl" aria-hidden="true">
          {a?.icon ?? '🏅'}
        </span>
        <div>
          <p className="text-xs font-black tracking-wide text-candy-purple uppercase">
            {t('ach.unlocked')}
          </p>
          <p className="font-black text-ink">{t(`ach.${next}.name` as StringKey)}</p>
        </div>
      </div>
    </div>
  );
}

export function StorageWarning() {
  const { t } = useT();
  const [failed, setFailed] = useState(false);
  useEffect(() => onStorageFailure(setFailed), []);
  if (!failed) return null;
  return (
    <div
      role="alert"
      className="mx-3 mt-2 rounded-2xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900"
    >
      ⚠️ {t('storage.failed')}
    </div>
  );
}
