import { useState } from 'react';
import { sfx } from '../../audio/synth';
import {
  BUDGET_GOALS,
  BUDGET_PRICES,
  budgetOver,
  daysLeft,
  remaining,
  settleBudget,
  type BudgetItem,
  type BudgetResult,
} from '../../game/budget';
import { BUDGET_ALLOWANCE } from '../../game/constants';
import { useAppStore } from '../../store/useAppStore';
import { useNow } from '../hooks';
import { Card, H3, Meter, PrimaryButton, SecondaryButton } from './shared';
import { useLearn } from './useLearn';

const PRICE_ITEMS: BudgetItem[] = ['meal', 'clean', 'medicine', 'snack', 'sweetSnack', 'minigame'];

/** Budget week: a pretend allowance for needs and wants, with a savings goal. */
export function BudgetView() {
  const { L, n, tp, f } = useLearn();
  const B = L.budget;
  const budget = useAppStore((s) => s.game.budget);
  const diary = useAppStore((s) => s.game.diary);
  const start = useAppStore((s) => s.startBudget);
  const close = useAppStore((s) => s.closeBudget);
  const cancel = useAppStore((s) => s.cancelBudget);
  const now = useNow(60_000);
  const [goal, setGoal] = useState<number>(BUDGET_GOALS[1]);
  const [result, setResult] = useState<BudgetResult | null>(null);

  const prices = (
    <Card tint="bg-white ring-1 ring-ink/10">
      <H3>{B.prices}</H3>
      <ul className="mt-1 divide-y divide-ink/5 text-sm text-ink">
        {PRICE_ITEMS.map((item) => {
          const p = BUDGET_PRICES[item]!;
          return (
            <li key={item} className="flex justify-between py-1">
              <span>
                {B.items[item]}{' '}
                <span className="text-xs text-ink/50">
                  ({p.kind === 'need' ? B.needs : B.wants})
                </span>
              </span>
              <span className="font-black">🪙 {n(p.price)}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-1 text-xs text-ink/60">{B.free}</p>
    </Card>
  );

  if (result) {
    const o = B.outcomes[result.outcome];
    return (
      <div className="space-y-3 pb-3" role="status">
        <Card tint={result.outcome === 'great' ? 'bg-emerald-50' : 'bg-amber-50'}>
          <H3>{o.title}</H3>
          <p className="mt-1 text-sm text-ink">
            {f(o.text, {
              left: tp('count.coins', Math.max(0, result.left)),
              missed: result.missedCalls,
            })}
          </p>
          <p className="mt-2 font-black text-candy-purple">+{tp('count.coins', result.coins)}</p>
        </Card>
        <SecondaryButton onClick={() => setResult(null)}>
          {L.lab.tiles.budget.title}
        </SecondaryButton>
      </div>
    );
  }

  if (budget) {
    const over = budgetOver(budget, now);
    const left = remaining(budget);
    return (
      <div className="space-y-3 pb-3">
        <Card tint="bg-pink-50">
          <div className="flex items-baseline justify-between">
            <H3>
              {B.left}: 🪙 {n(left)}
            </H3>
            <span className="text-sm font-bold text-ink/60">
              {f(B.goal + ': {goal}', { goal: budget.goal })}
            </span>
          </div>
          <div className="mt-2 space-y-2">
            <Meter
              label={B.needs}
              value={budget.needs}
              max={budget.allowance}
              color="#3ddc97"
              text={n(budget.needs)}
            />
            <Meter
              label={B.wants}
              value={budget.wants}
              max={budget.allowance}
              color="#ff8c42"
              text={n(budget.wants)}
            />
          </div>
          {!over && (
            <p className="mt-2 text-sm font-bold text-ink">
              {f(B.daysLeft, { days: daysLeft(budget, now) })}
            </p>
          )}
        </Card>
        {over ? (
          <>
            <Card tint="bg-amber-50">
              <p className="font-black text-ink">🏁 {B.ready}</p>
            </Card>
            <PrimaryButton
              onClick={() => {
                const r = close();
                if (r) {
                  if (r.coins > 0) sfx.coin();
                  setResult(r);
                }
              }}
            >
              🪙 {f(B.collect, { coins: settleBudget(budget, diary).coins })}
            </PrimaryButton>
          </>
        ) : (
          <>
            {prices}
            <SecondaryButton onClick={cancel}>{B.cancel}</SecondaryButton>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-3">
      <p className="text-sm text-ink/70">{B.intro}</p>
      <Card tint="bg-amber-50">
        <ul className="list-disc space-y-1 pl-5 text-sm text-ink">
          {B.rules.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </Card>
      {prices}
      <Card tint="bg-pink-50">
        <H3>
          🪙 {n(BUDGET_ALLOWANCE)} · {B.goal}
        </H3>
        <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label={B.goal}>
          {BUDGET_GOALS.map((g) => (
            <button
              key={g}
              type="button"
              role="radio"
              aria-checked={goal === g}
              onClick={() => setGoal(g)}
              className={`min-h-12 rounded-xl font-black ${goal === g ? 'bg-candy-purple text-white' : 'bg-white text-ink'}`}
            >
              🪙 {n(g)}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <PrimaryButton onClick={() => start(goal)}>💸 {B.start}</PrimaryButton>
        </div>
      </Card>
    </div>
  );
}
