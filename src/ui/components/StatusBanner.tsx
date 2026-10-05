import { useState } from 'react';
import { hasOpenCase } from '../../game/detective';
import { isCritical, timeToNextStage } from '../../game/status';
import { activeCallKinds } from '../../game/simulation';
import type { CallKind, Pet } from '../../game/types';
import { useT } from '../../i18n/useT';
import type { PetAction } from '../../store/useAppStore';
import { formatClockDuration } from '../format';
import { useNow } from '../hooks';

interface Banner {
  tone: 'danger' | 'warn' | 'info' | 'calm';
  text: string;
  action?: { label: string; run: PetAction | (() => void) };
  /** Short "why does this matter?" explanation, revealed on demand. */
  why?: CallKind | 'sick';
}

function EggBanner({ pet }: { pet: Pet }) {
  const { t } = useT();
  const now = useNow(1000);
  return (
    <div className="mx-3 rounded-2xl bg-white/75 px-4 py-2 text-center shadow-sm" role="status">
      <p className="font-black text-ink">
        {t('egg.hatchesIn', { time: formatClockDuration(timeToNextStage(pet, now)) })}
      </p>
      <p className="text-sm font-semibold text-ink/70">{t('egg.tapToWarm')}</p>
    </div>
  );
}

/** One prioritised message: critical > sick > tantrum > needs > sleeping. */
export function StatusBanner({
  pet,
  onAction,
  onInvestigate,
}: {
  pet: Pet;
  onAction: (a: PetAction) => void;
  onInvestigate?: () => void;
}) {
  const { t } = useT();
  const now = useNow(60_000);
  const [whyOpen, setWhyOpen] = useState<string | null>(null);
  if (pet.dead) return null;
  if (pet.stage === 'egg') return <EggBanner pet={pet} />;
  const name = pet.name;
  const calls = activeCallKinds(pet);
  const gentle = now < (pet.gentleUntil ?? 0);
  let banner: Banner | null = null;

  if (isCritical(pet)) banner = { tone: 'danger', text: t('status.critical', { name }) };
  else if (pet.sick)
    banner = {
      tone: 'danger',
      text: t('status.sick', { name }),
      why: 'sick',
      ...(hasOpenCase(pet) && onInvestigate
        ? { action: { label: `🔍 ${t('detective.investigate')}`, run: onInvestigate } }
        : {}),
    };
  else if (pet.actingUp && !pet.asleep)
    banner = {
      tone: 'warn',
      text: t('status.actingUp', { name }),
      action: { label: t('action.scold'), run: 'scold' },
    };
  else if (calls.length > 0) {
    const c = calls[0]!;
    // During the gentle start the pet explains which button helps.
    banner = {
      tone: 'warn',
      text: gentle ? `${name}: ${t(`hint.${c}`)}` : t(`need.${c}`, { name }),
      why: c,
    };
  } else if (pet.asleep)
    banner = {
      tone: 'calm',
      text: `💤 ${t('status.sleeping')}${pet.lightsOn ? '' : ` · ${t('status.lightsOff')}`}`,
      action: { label: t('action.wake'), run: 'wake' },
    };

  if (!banner && gentle) banner = { tone: 'info', text: t('hint.gentle') };
  if (!banner) return <div className="h-2" />;
  const tones = {
    danger: 'bg-rose-600 text-white',
    warn: 'bg-amber-300 text-ink',
    info: 'bg-white/80 text-ink',
    calm: 'bg-indigo-900/70 text-white',
  };
  const icon = { danger: '🚨', warn: '⚠️', info: 'ℹ️', calm: '' }[banner.tone];
  const action = banner.action;
  const why = banner.why;
  const showWhy = why !== undefined && whyOpen === why;
  return (
    <div
      role={banner.tone === 'danger' ? 'alert' : 'status'}
      className={`anim-pop mx-3 rounded-2xl px-3 py-1.5 font-bold shadow-md ${tones[banner.tone]}`}
    >
      <div className="flex min-h-11 items-center gap-2">
        {icon && <span aria-hidden="true">{icon}</span>}
        <span className="flex-1 text-sm leading-tight">{banner.text}</span>
        {why && (
          <button
            type="button"
            onClick={() => setWhyOpen(showWhy ? null : why)}
            aria-expanded={showWhy}
            className="min-h-11 shrink-0 rounded-xl bg-white/30 px-2 text-xs font-black active:scale-95"
          >
            {t('status.why')}
          </button>
        )}
        {action && (
          <button
            type="button"
            onClick={() => (typeof action.run === 'function' ? action.run() : onAction(action.run))}
            className="min-h-11 shrink-0 rounded-xl bg-white/90 px-3 text-sm font-black text-ink shadow active:scale-95"
          >
            {action.label}
          </button>
        )}
      </div>
      {showWhy && <p className="pb-1 text-xs leading-snug font-semibold">💡 {t(`why.${why}`)}</p>}
    </div>
  );
}
