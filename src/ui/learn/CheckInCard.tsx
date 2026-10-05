import { useState } from 'react';
import { sfx } from '../../audio/synth';
import { HEAVY_MOODS, MOODS, MOOD_ICON, type Mood } from '../../game/learning';
import { useAppStore } from '../../store/useAppStore';
import { Sheet } from '../components/Sheet';
import { SPECIES_ICON } from '../icons';
import { PrimaryButton } from './shared';
import { useLearn } from './useLearn';

/** Daily feelings check-in: the pet asks how the player is and answers with a coping tip. */
export default function CheckInCard({ onClose }: { onClose: () => void }) {
  const { L, t } = useLearn();
  const C = L.checkin;
  const pet = useAppStore((s) => s.game.pet);
  const checkIn = useAppStore((s) => s.checkIn);
  const [mood, setMood] = useState<Mood | null>(null);
  if (!pet) return null;

  return (
    <Sheet title={`💬 ${pet.name}`} onClose={onClose}>
      <div className="pb-3">
        <div className="flex items-start gap-3">
          <span className="text-5xl" aria-hidden="true">
            {SPECIES_ICON[pet.species]}
          </span>
          <p className="relative mt-1 flex-1 rounded-2xl bg-violet-50 px-4 py-3 text-lg font-black text-ink">
            {mood ? C.replies[mood] : C.question}
          </p>
        </div>
        {!mood ? (
          <>
            <ul className="mt-4 grid grid-cols-4 gap-2">
              {MOODS.map((m) => (
                <li key={m}>
                  <button
                    type="button"
                    onClick={() => {
                      sfx.tick();
                      checkIn(m);
                      setMood(m);
                    }}
                    className="flex min-h-20 w-full flex-col items-center justify-center rounded-2xl bg-amber-50 text-xs font-bold text-ink active:scale-95"
                  >
                    <span className="text-3xl" aria-hidden="true">
                      {MOOD_ICON[m]}
                    </span>
                    {C.moods[m]}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-center text-xs text-ink/50">🔒 {C.privacy}</p>
          </>
        ) : (
          <div className="mt-4 space-y-3" role="status">
            <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-ink">
              {C.tips[mood]}
            </p>
            {HEAVY_MOODS.includes(mood) && (
              <div className="rounded-2xl bg-sky-50 p-3 text-sm text-ink">
                <p>{C.talk}</p>
                <p className="mt-1 font-bold">📞 {C.helpline}</p>
              </div>
            )}
            <PrimaryButton onClick={onClose}>{t('common.gotIt')}</PrimaryButton>
          </div>
        )}
      </div>
    </Sheet>
  );
}
