import { DAY, SENIOR_MAX, SENIOR_MIN, STAGE_DURATION } from '../../game/constants';
import type { Pet } from '../../game/types';
import { WILD, type LifeStage } from '../../game/wild';
import { Card } from './shared';
import { useLearn } from './useLearn';
import { formatAge } from './units';

const LIFE_STAGES: LifeStage[] = ['baby', 'child', 'teen', 'adult', 'senior'];
const STAGE_ICON: Record<LifeStage, string> = {
  baby: '🍼',
  child: '🧸',
  teen: '🎧',
  adult: '🏆',
  senior: '🌅',
};

/** Life cycle: game stages (days) side by side with the real animal's ages. */
export function LifeView({ pet }: { pet: Pet }) {
  const { L, t, tp, n, locale } = useLearn();
  const wild = WILD[pet.species];
  const gameDays = (s: LifeStage): string =>
    s === 'senior'
      ? `${n(SENIOR_MIN / DAY)}–${tp('count.daysNom', SENIOR_MAX / DAY)}`
      : tp('count.daysNom', STAGE_DURATION[s] / DAY);
  return (
    <div className="space-y-3 pb-3">
      <p className="text-sm text-ink/70">{L.life.intro}</p>
      <div className="grid grid-cols-[2rem_1fr_1fr] gap-x-2 px-3 text-xs font-black tracking-wide text-ink/50 uppercase">
        <span />
        <span>{L.life.inGame}</span>
        <span>{wild.domestic ? L.life.realPet : L.life.realLife}</span>
      </div>
      <ol className="space-y-1.5">
        {LIFE_STAGES.map((s) => {
          const now = pet.stage === s;
          return (
            <li
              key={s}
              className={`grid grid-cols-[2rem_1fr_1fr] items-center gap-x-2 rounded-2xl px-3 py-2 ${now ? 'bg-candy-pink/15 ring-2 ring-candy-pink' : 'bg-violet-50'}`}
            >
              <span className="text-2xl" aria-hidden="true">
                {STAGE_ICON[s]}
              </span>
              <span>
                <span className="block font-black text-ink">
                  {t(`stage.${s}`)}
                  {now && (
                    <span className="ml-1 rounded-full bg-candy-pink px-1.5 text-[10px] text-white">
                      {L.life.now}
                    </span>
                  )}
                </span>
                <span className="text-sm text-ink/70">{gameDays(s)}</span>
              </span>
              <span className="text-sm font-bold text-ink">
                {formatAge(locale, wild.stages[s], L.life.olderThan)}
              </span>
            </li>
          );
        })}
      </ol>
      <Card tint="bg-amber-50">
        <p className="text-sm font-semibold text-ink">💡 {L.life.note[pet.species]}</p>
      </Card>
      <p className="text-xs text-ink/50">{L.life.approx}</p>
    </div>
  );
}
