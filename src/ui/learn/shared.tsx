import type { ReactNode } from 'react';

export function Card({
  children,
  tint = 'bg-violet-50',
  className = '',
}: {
  children: ReactNode;
  tint?: string;
  className?: string;
}) {
  return <section className={`rounded-2xl p-3 ${tint} ${className}`}>{children}</section>;
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="font-black text-ink">{children}</h3>;
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="min-h-12 w-full rounded-xl bg-candy-pink px-4 font-black text-white shadow active:scale-95 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-12 w-full rounded-xl bg-ink/5 px-4 font-bold text-ink active:scale-95"
    >
      {children}
    </button>
  );
}

/** Horizontal meter with a visible number (colour is never the only cue). */
export function Meter({
  label,
  value,
  max = 100,
  color = '#7c3aed',
  text,
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
  text?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-sm font-bold text-ink">
        <span>{label}</span>
        <span>{text ?? Math.round(value)}</span>
      </div>
      <div
        className="mt-1 h-3 overflow-hidden rounded-full bg-ink/10"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(value)}
      >
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
