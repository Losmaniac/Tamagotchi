import { isCritical, timeToNextStage } from '../../game/status';
import { activeCallKinds } from '../../game/simulation';
import type { Pet } from '../../game/types';
import { useT } from '../../i18n/useT';
import type { PetAction } from '../../store/useAppStore';
import { formatClockDuration } from '../format';
import { useNow } from '../hooks';

interface Banner {
  tone: 'danger' | 'warn' | 'info' | 'calm';
  text: string;
  action?: { label: string; run: PetAction };
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
export function StatusBanner({ pet, onAction }: { pet: Pet; onAction: (a: PetAction) => void }) {
  const { t } = useT();
  if (pet.dead) return null;
  if (pet.stage === 'egg') return <EggBanner pet={pet} />;
  const name = pet.name;
  const calls = activeCallKinds(pet);
  let banner: Banner | null = null;

  if (isCritical(pet)) banner = { tone: 'danger', text: t('status.critical', { name }) };
  else if (pet.sick) banner = { tone: 'danger', text: t('status.sick', { name }) };
  else if (pet.actingUp && !pet.asleep)
    banner = {
      tone: 'warn',
      text: t('status.actingUp', { name }),
      action: { label: t('action.scold'), run: 'scold' },
    };
  else if (calls.length > 0) {
    const c = calls[0]!;
    banner = { tone: 'warn', text: t(`need.${c}`, { name }) };
  } else if (pet.asleep)
    banner = {
      tone: 'calm',
      text: `💤 ${t('status.sleeping')}${pet.lightsOn ? '' : ` · ${t('status.lightsOff')}`}`,
      action: { label: t('action.wake'), run: 'wake' },
    };

  if (!banner) return <div className="h-2" />;
  const tones = {
    danger: 'bg-rose-600 text-white',
    warn: 'bg-amber-300 text-ink',
    info: 'bg-white/80 text-ink',
    calm: 'bg-indigo-900/70 text-white',
  };
  const icon = { danger: '🚨', warn: '⚠️', info: 'ℹ️', calm: '' }[banner.tone];
  return (
    <div
      role={banner.tone === 'danger' ? 'alert' : 'status'}
      className={`anim-pop mx-3 flex min-h-12 items-center gap-2 rounded-2xl px-3 py-1.5 font-bold shadow-md ${tones[banner.tone]}`}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      <span className="flex-1 text-sm leading-tight">{banner.text}</span>
      {banner.action && (
        <button
          type="button"
          onClick={() => onAction(banner.action!.run)}
          className="min-h-11 shrink-0 rounded-xl bg-white/90 px-3 text-sm font-black text-ink shadow active:scale-95"
        >
          {banner.action.label}
        </button>
      )}
    </div>
  );
}
