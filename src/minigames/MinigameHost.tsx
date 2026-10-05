import { lazy, Suspense, useCallback, useState } from 'react';
import { sfx, unlockAudio } from '../audio/synth';
import type { MinigameId } from '../game/save';
import type { Species } from '../game/types';
import { useT } from '../i18n/useT';
import { withChunkReload } from '../pwa/registerSW';
import { useAppStore } from '../store/useAppStore';
import { useReducedMotion } from '../ui/hooks';

// Each game is its own chunk, loaded only when played.
const GAMES = {
  snackCatch: lazy(withChunkReload(() => import('./SnackCatch'))),
  rhythmTap: lazy(withChunkReload(() => import('./RhythmTap'))),
  leftRight: lazy(withChunkReload(() => import('./LeftRight'))),
  wordSnack: lazy(withChunkReload(() => import('./WordSnack'))),
};

type Phase =
  | { kind: 'intro' }
  | { kind: 'play'; run: number }
  | { kind: 'result'; score: number; coins: number; ok: boolean };

interface HostProps {
  id: MinigameId;
  species: Species;
  name: string;
  onClose: () => void;
}

/** Full-screen mini-game overlay: how-to → play → reward. */
export function MinigameHost({ id, species, name, onClose }: HostProps) {
  const { t, n } = useT();
  const reduced = useReducedMotion();
  const playMinigame = useAppStore((s) => s.playMinigame);
  const [phase, setPhase] = useState<Phase>({ kind: 'intro' });
  const Game = GAMES[id];

  const onFinish = useCallback(
    (normalized: number) => {
      const res = playMinigame(id, normalized);
      if (res.ok) sfx.coin();
      setPhase({ kind: 'result', score: normalized, coins: res.coins, ok: res.ok });
    },
    [id, playMinigame],
  );

  const start = () => {
    unlockAudio();
    setPhase((p) => ({ kind: 'play', run: p.kind === 'play' ? p.run + 1 : Date.now() }));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t(`game.${id}`)}
      className="fixed inset-0 z-40 flex flex-col bg-gradient-to-b from-sky-200 via-violet-200 to-pink-200"
      style={{
        padding:
          'max(0.75rem, env(safe-area-inset-top)) 0.75rem max(0.75rem, env(safe-area-inset-bottom))',
      }}
    >
      <header className="flex items-center justify-between pb-2">
        <h2 className="text-2xl font-black text-ink">{t(`game.${id}`)}</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex size-12 items-center justify-center rounded-full bg-white/70 text-2xl font-bold text-ink"
          aria-label={t('common.close')}
        >
          ×
        </button>
      </header>

      {phase.kind === 'intro' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <p className="max-w-xs text-xl font-bold text-ink">{t(`mg.${id}.howto`)}</p>
          <button
            type="button"
            onClick={start}
            autoFocus
            className="h-16 w-56 rounded-2xl bg-candy-pink text-2xl font-black text-white shadow-lg active:scale-95"
          >
            {t('mg.start')}
          </button>
        </div>
      )}

      {phase.kind === 'play' && (
        <div className="min-h-0 flex-1">
          <Suspense
            fallback={<div className="flex h-full items-center justify-center text-4xl">⏳</div>}
          >
            <Game key={phase.run} species={species} onFinish={onFinish} reduced={reduced} />
          </Suspense>
        </div>
      )}

      {phase.kind === 'result' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-6xl" aria-hidden="true">
            {phase.score >= 0.9 ? '🏆' : phase.score >= 0.5 ? '🎉' : '👍'}
          </p>
          <p className="text-3xl font-black text-ink">{t('mg.result')}</p>
          <p className="text-5xl font-black text-candy-purple">
            {n(Math.round(phase.score * 100))} %
          </p>
          <p className="text-lg font-bold text-ink/80" role="status">
            {phase.ok ? t('mg.reward', { coins: n(phase.coins) }) : t('outcome.tooTired', { name })}
          </p>
          <div className="mt-2 grid w-full max-w-xs grid-cols-2 gap-3">
            <button
              type="button"
              onClick={start}
              disabled={!phase.ok}
              className="h-14 rounded-2xl bg-white font-black text-ink shadow-md disabled:opacity-40"
            >
              {t('mg.again')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-14 rounded-2xl bg-candy-pink font-black text-white shadow-md"
            >
              {t('mg.done')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
