import { useState } from 'react';
import { sfx } from '../../audio/synth';
import { PLATE_MAX_TREATS, PLATE_COINS } from '../../game/constants';
import { SNACKS } from '../../game/food';
import { localDayKey } from '../../game/game';
import {
  NUTRIENTS,
  NUTRITION,
  currentPlate,
  plateComplete,
  plateGoals,
  treatsOk,
  type FoodGroup,
  type FoodId,
} from '../../game/nutrition';
import { useAppStore } from '../../store/useAppStore';
import { useNow } from '../hooks';
import { Card, H3, Meter, PrimaryButton } from './shared';
import { useLearn } from './useLearn';

const GROUP_ICON: Record<FoodGroup, string> = {
  fruit: '🍎',
  veg: '🥦',
  protein: '🍗',
  meal: '🍱',
  treat: '🍬',
};

function Dots({ level, label }: { level: number; label: string }) {
  return (
    <span className="flex justify-center gap-0.5" role="img" aria-label={`${label}: ${level}/3`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`size-2 rounded-full ${i <= level ? 'bg-candy-purple' : 'bg-ink/15'}`}
        />
      ))}
    </span>
  );
}

/** Food lab: nutrition table plus the weekly balanced-plate challenge. */
export function FoodView() {
  const { L, t, n, f } = useLearn();
  const plateRaw = useAppStore((s) => s.game.plate);
  const claimPlate = useAppStore((s) => s.claimPlate);
  const now = useNow(60_000);
  const [reward, setReward] = useState<number | null>(null);
  const plate = currentPlate(plateRaw, localDayKey(now));
  const F = L.food;
  const foods: { id: FoodId; emoji: string; name: string }[] = [
    { id: 'meal', emoji: '🍱', name: F.meal },
    ...SNACKS.map((s) => ({ id: s.id as FoodId, emoji: s.emoji, name: t(`snack.${s.id}`) })),
  ];
  return (
    <div className="space-y-3 pb-3">
      <Card tint="bg-emerald-50">
        <H3>🥗 {F.plateTitle}</H3>
        <p className="mt-1 text-sm text-ink/70">{F.plateText}</p>
        <div className="mt-2 space-y-2">
          {plateGoals(plate).map((g) => (
            <Meter
              key={g.group}
              label={`${GROUP_ICON[g.group]} ${F.groups[g.group]}${g.done ? ' ✓' : ''}`}
              value={Math.min(g.have, g.need)}
              max={g.need}
              color="#3ddc97"
              text={`${n(g.have)}/${n(g.need)}`}
            />
          ))}
          <p className={`text-sm font-bold ${treatsOk(plate) ? 'text-ink' : 'text-rose-700'}`}>
            {GROUP_ICON.treat} {f(F.treats, { max: PLATE_MAX_TREATS })} · {n(plate.counts.treat)}
            {treatsOk(plate) ? ' ✓' : ' ✗'}
          </p>
        </div>
        <div className="mt-3">
          {plate.claimed ? (
            <p className="text-sm font-bold text-emerald-700">{F.claimed}</p>
          ) : (
            <PrimaryButton
              disabled={!plateComplete(plate)}
              onClick={() => {
                const coins = claimPlate();
                if (coins > 0) {
                  sfx.coin();
                  setReward(coins);
                }
              }}
            >
              🪙 {f(F.claim, { coins: PLATE_COINS })}
            </PrimaryButton>
          )}
          {reward !== null && (
            <p role="status" className="mt-2 text-center font-black text-candy-purple">
              {f(F.reward, { coins: reward })}
            </p>
          )}
        </div>
      </Card>

      <Card tint="bg-white ring-1 ring-ink/10">
        <H3>{F.tableTitle}</H3>
        <p className="mt-1 text-sm text-ink/70">{F.intro}</p>
        <table className="mt-2 w-full text-center text-xs">
          <thead>
            <tr className="text-ink/60">
              <th className="py-1 text-left font-bold" />
              {NUTRIENTS.map((k) => (
                <th key={k} className="py-1 font-bold">
                  {F.nutrients[k]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {foods.map((food) => {
              const info = NUTRITION[food.id];
              return (
                <tr key={food.id} className="border-t border-ink/5">
                  <th scope="row" className="py-1.5 text-left font-bold text-ink">
                    <span aria-hidden="true">{food.emoji}</span> {food.name}
                    <span className="block text-[10px] font-semibold text-ink/50">
                      {F.groups[info.group]}
                    </span>
                  </th>
                  {NUTRIENTS.map((k) => (
                    <td key={k}>
                      <Dots level={info.levels[k]} label={F.nutrients[k]} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-ink/60">💡 {F.tip}</p>
      </Card>
    </div>
  );
}
