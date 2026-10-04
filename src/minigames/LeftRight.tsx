import { useState } from 'react';
import { haptic } from '../audio/haptics';
import { sfx } from '../audio/synth';
import { useT } from '../i18n/useT';
import { SPECIES_ICON } from '../ui/icons';
import { ROUNDS, leftRightNormalized, makeTurns, type Side } from './leftRightLogic';
import type { MinigameProps } from './types';

/** Classic Tamagotchi game: guess which way your pal will turn. */
export default function LeftRight({ species, onFinish, reduced }: MinigameProps) {
  const { t, n } = useT();
  const [turns] = useState(() => makeTurns(Date.now() >>> 0));
  const [round, setRound] = useState(0);
  const [wins, setWins] = useState(0);
  const [reveal, setReveal] = useState<{ guess: Side; win: boolean } | null>(null);

  const guess = (side: Side) => {
    if (reveal) return;
    const win = turns[round] === side;
    if (win) {
      sfx.happy();
      haptic.success();
    } else sfx.no();
    setReveal({ guess: side, win });
    const nextWins = wins + (win ? 1 : 0);
    window.setTimeout(() => {
      setReveal(null);
      setWins(nextWins);
      if (round + 1 >= ROUNDS) onFinish(leftRightNormalized(nextWins), nextWins);
      else setRound(round + 1);
    }, 1100);
  };

  const turn = reveal ? turns[round] : null;
  const shift =
    turn === 'left' ? '-translate-x-16 -scale-x-100' : turn === 'right' ? 'translate-x-16' : '';
  return (
    <div className="flex h-full flex-col">
      <div className="flex justify-between px-4 py-2 text-lg font-black text-ink">
        <span>
          {t('mg.leftRight.round', { n: n(Math.min(round + 1, ROUNDS)), total: n(ROUNDS) })}
        </span>
        <span>✓ {n(wins + (reveal?.win ? 1 : 0))}</span>
      </div>
      <div className="relative flex flex-1 items-center justify-center rounded-3xl bg-white/40">
        <span
          className={`text-8xl ${reduced ? '' : 'transition-transform duration-500'} ${shift}`}
          aria-hidden="true"
        >
          {SPECIES_ICON[species]}
        </span>
        {reveal && (
          <p
            role="status"
            className={`absolute top-8 text-3xl font-black ${reveal.win ? 'text-emerald-600' : 'text-rose-500'}`}
          >
            {reveal.win ? t('mg.leftRight.win') : t('mg.leftRight.lose')}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 pt-3">
        {(['left', 'right'] as const).map((side) => (
          <button
            key={side}
            type="button"
            onClick={() => guess(side)}
            disabled={!!reveal}
            className="h-20 rounded-2xl bg-white text-xl font-black text-ink shadow-md active:scale-95 disabled:opacity-60"
          >
            {side === 'left' ? '👈 ' : ''}
            {t(`mg.leftRight.${side}`)}
            {side === 'right' ? ' 👉' : ''}
          </button>
        ))}
      </div>
    </div>
  );
}
