// Budget week: a pretend weekly allowance that has to cover needs and wants,
// with a savings goal. Leftover allowance is paid out as real coins at the end.
import { BUDGET_ALLOWANCE, BUDGET_BONUS, BUDGET_DAYS, BUDGET_MAX_MISSED, DAY } from './constants';
import { daysBetween, shiftDay, type CareKind, type DiaryDay } from './diary';

export type Spend = 'need' | 'want';
export type BudgetItem = CareKind | 'sweetSnack' | 'minigame';

export const BUDGET_PRICES: Partial<Record<BudgetItem, { price: number; kind: Spend }>> = {
  meal: { price: 3, kind: 'need' },
  medicine: { price: 5, kind: 'need' },
  clean: { price: 1, kind: 'need' },
  snack: { price: 1, kind: 'want' },
  sweetSnack: { price: 2, kind: 'want' },
  minigame: { price: 2, kind: 'want' },
};

export const BUDGET_GOALS = [10, 20, 30] as const;

export interface Budget {
  startedAt: number;
  startDay: string;
  goal: number;
  allowance: number;
  needs: number;
  wants: number;
}

export type BudgetOutcome = 'great' | 'short' | 'overspent' | 'skimped';

export interface BudgetResult {
  outcome: BudgetOutcome;
  left: number;
  missedCalls: number;
  coins: number;
}

export function startBudget(now: number, today: string, goal: number): Budget {
  return { startedAt: now, startDay: today, goal, allowance: BUDGET_ALLOWANCE, needs: 0, wants: 0 };
}

export function spent(b: Budget): number {
  return b.needs + b.wants;
}

export function remaining(b: Budget): number {
  return b.allowance - spent(b);
}

/** Records a purchase while the budget week is running. */
export function spend(b: Budget, item: BudgetItem, now: number): Budget {
  const p = BUDGET_PRICES[item];
  if (!p || budgetOver(b, now)) return b;
  return p.kind === 'need'
    ? { ...b, needs: b.needs + p.price }
    : { ...b, wants: b.wants + p.price };
}

export function budgetOver(b: Budget, now: number): boolean {
  return now - b.startedAt >= BUDGET_DAYS * DAY;
}

export function daysLeft(b: Budget, now: number): number {
  // Clamped: the UI clock can be a moment behind the start time.
  const days = Math.ceil((b.startedAt + BUDGET_DAYS * DAY - now) / DAY);
  return Math.min(BUDGET_DAYS, Math.max(0, days));
}

/** Settles a finished week. Skimping on needs (missed calls) counts as a failed budget. */
export function settleBudget(b: Budget, diary: DiaryDay[]): BudgetResult {
  const missedCalls = daysBetween(diary, b.startDay, shiftDay(b.startDay, BUDGET_DAYS)).reduce(
    (a, d) => a + d.missedCalls,
    0,
  );
  const left = remaining(b);
  let outcome: BudgetOutcome;
  if (left < 0) outcome = 'overspent';
  else if (missedCalls > BUDGET_MAX_MISSED) outcome = 'skimped';
  else if (left >= b.goal) outcome = 'great';
  else outcome = 'short';
  const coins =
    outcome === 'overspent' ? 0 : Math.max(0, left) + (outcome === 'great' ? BUDGET_BONUS : 0);
  return { outcome, left, missedCalls, coins };
}
