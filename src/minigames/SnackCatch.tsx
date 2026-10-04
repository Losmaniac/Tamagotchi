import { useEffect, useRef, useState } from 'react';
import { haptic } from '../audio/haptics';
import { sfx } from '../audio/synth';
import { useT } from '../i18n/useT';
import { SPECIES_ICON } from '../ui/icons';
import {
  PLAYER_Y,
  SNACK_DURATION,
  createSnackState,
  snackNormalized,
  stepSnack,
} from './snackCatchLogic';
import type { MinigameProps } from './types';

/** Drag your pal left/right to catch falling snacks; broccoli costs points. */
export default function SnackCatch({ species, onFinish }: MinigameProps) {
  const { t, n } = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerX = useRef(0.5);
  const [hud, setHud] = useState({ score: 0, left: SNACK_DURATION });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const state = createSnackState(Date.now() >>> 0);
    let raf = 0;
    let last = performance.now();
    let done = false;
    let hudTimer = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const events = stepSnack(state, dt, playerX.current);
      for (const e of events) {
        if (e === 'catch') sfx.good();
        else if (e === 'bad') {
          sfx.miss();
          haptic.error();
        }
      }
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const size = Math.min(W, H) * 0.09;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${size}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
      for (const item of state.items) ctx.fillText(item.emoji, item.x * W, item.y * H);
      ctx.font = `${size * 1.7}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
      ctx.fillText(SPECIES_ICON[species], playerX.current * W, PLAYER_Y * H);

      hudTimer += dt;
      if (hudTimer > 0.1 || events.length) {
        hudTimer = 0;
        setHud({ score: state.score, left: Math.max(0, Math.ceil(SNACK_DURATION - state.time)) });
      }
      if (state.over && !done) {
        done = true;
        onFinish(snackNormalized(state.score), state.score);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [species, onFinish]);

  const move = (clientX: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    playerX.current = Math.min(0.95, Math.max(0.05, (clientX - rect.left) / rect.width));
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex justify-between px-4 py-2 text-lg font-black text-ink">
        <span>{t('mg.score', { score: n(hud.score) })}</span>
        <span aria-live="off">⏱ {t('mg.timeLeft', { s: n(hud.left) })}</span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full flex-1 touch-none rounded-3xl bg-white/40"
        onPointerDown={(e) => move(e.clientX)}
        onPointerMove={(e) => move(e.clientX)}
        aria-label={t('mg.snackCatch.howto')}
        role="img"
      />
    </div>
  );
}
