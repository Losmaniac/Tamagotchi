// Piggy bank: coins kept for a full period earn compound interest.
import { BANK_HISTORY_LIMIT, BANK_PERIOD, BANK_RATE } from './constants';

export interface Bank {
  balance: number;
  /** Start of the current interest period (0 = never used). */
  periodStart: number;
  history: { t: number; balance: number }[];
}

export function createBank(): Bank {
  return { balance: 0, periodStart: 0, history: [] };
}

export function interestFor(balance: number): number {
  if (balance <= 0) return 0;
  return Math.max(1, Math.floor(balance * BANK_RATE));
}

function record(bank: Bank, t: number): void {
  bank.history = [...bank.history, { t, balance: bank.balance }].slice(-BANK_HISTORY_LIMIT);
}

/** Credits interest for every full period that has passed. Returns coins earned. Mutates. */
export function accrueInterest(bank: Bank, now: number): number {
  if (bank.periodStart === 0) return 0;
  let earned = 0;
  while (now - bank.periodStart >= BANK_PERIOD) {
    bank.periodStart += BANK_PERIOD;
    const gain = interestFor(bank.balance);
    if (gain > 0) {
      bank.balance += gain;
      earned += gain;
      record(bank, bank.periodStart);
    }
  }
  return earned;
}

export function deposit(bank: Bank, amount: number, now: number): void {
  if (amount <= 0) return;
  accrueInterest(bank, now);
  if (bank.periodStart === 0) bank.periodStart = now;
  bank.balance += amount;
  record(bank, now);
}

/** Withdraws up to `amount`; returns what was actually taken out. */
export function withdraw(bank: Bank, amount: number, now: number): number {
  accrueInterest(bank, now);
  const taken = Math.max(0, Math.min(amount, bank.balance));
  if (taken === 0) return 0;
  bank.balance -= taken;
  record(bank, now);
  return taken;
}

export function timeToNextInterest(bank: Bank, now: number): number | null {
  if (bank.periodStart === 0 || bank.balance <= 0) return null;
  return Math.max(0, bank.periodStart + BANK_PERIOD - now);
}
