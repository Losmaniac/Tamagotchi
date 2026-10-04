import { petAge } from '../game/death';
import type { Pet } from '../game/types';
import { useT } from '../i18n/useT';
import { useAppStore } from '../store/useAppStore';
import { Memorial3D } from '../three/Memorial3D';
import { PetCanvas } from '../three/PetCanvas';
import { formatDuration } from './format';
import { usePageVisible, useReducedMotion } from './hooks';

/** Respectful farewell: a ghost floats up from a flowered tombstone. */
export function DeathScreen({ pet, onMemorial }: { pet: Pet; onMemorial: () => void }) {
  const { t, tp } = useT();
  const clearDeadPet = useAppStore((s) => s.clearDeadPet);
  const lowPower = useAppStore((s) => s.settings.lowPower);
  const reduced = useReducedMotion();
  const visible = usePageVisible();
  const cause = pet.deathCause ?? 'sickness';
  return (
    <main className="safe-area flex h-full flex-col bg-gradient-to-b from-indigo-200 via-violet-100 to-rose-100 text-center">
      <div className="relative min-h-0 flex-1">
        <PetCanvas
          className="absolute inset-0"
          lowPower={lowPower}
          mode={visible ? 'running' : 'hidden'}
          label={t('death.title', { name: pet.name })}
        >
          <Memorial3D motion={reduced ? 0.3 : 1} />
        </PetCanvas>
      </div>
      <section className="px-6 pb-6">
        <h1 className="text-3xl font-black text-ink">{t('death.title', { name: pet.name })}</h1>
        <p className="mt-1 font-bold text-ink/70">
          {t(`death.cause.${cause}`)} ·{' '}
          {t('death.age', { time: formatDuration(petAge(pet, pet.diedAt ?? 0), tp) })}
        </p>
        <p className="mt-3 text-ink/70 italic">{t('death.message')}</p>
        <button
          type="button"
          onClick={clearDeadPet}
          className="mt-5 h-14 w-full rounded-2xl bg-candy-pink text-lg font-black text-white shadow-md active:scale-[0.98]"
        >
          🥚 {t('death.newEgg')}
        </button>
        <button
          type="button"
          onClick={onMemorial}
          className="mt-2 h-12 w-full rounded-2xl bg-white/70 font-bold text-ink shadow-sm"
        >
          🪦 {t('memorial.title')}
        </button>
      </section>
    </main>
  );
}
