import { useEffect, useRef, useState } from 'react';
import { haptic } from '../audio/haptics';
import { sfx } from '../audio/synth';
import { useT } from '../i18n/useT';
import { SPECIES_ICON } from '../ui/icons';
import {
  APPROACH_MS,
  BEAT_MS,
  LEAD_BEATS,
  expire,
  isRhythmOver,
  makeNotes,
  rhythmNormalized,
  rhythmScore,
  tap,
  type Judgement,
} from './rhythmLogic';
import type { MinigameProps } from './types';

/** Tap when the shrinking ring meets the circle. */
export default function RhythmTap({ species, onFinish, reduced }: MinigameProps) {
  const { t, n } = useT();
  const ringRef = useRef<HTMLDivElement>(null);
  const petRef = useRef<HTMLSpanElement>(null);
  const start = useRef(0);
  const [notes] = useState(() => makeNotes(Date.now() >>> 0));
  const [flash, setFlash] = useState<{ j: Judgement; id: number } | null>(null);
  const [score, setScore] = useState(0);
  const flashId = useRef(0);

  useEffect(() => {
    start.current = performance.now();
    let raf = 0;
    let lastBeat = -1;
    let done = false;
    const frame = (now: number) => {
      const t0 = now - start.current;
      const beat = Math.floor(t0 / BEAT_MS);
      if (beat !== lastBeat) {
        lastBeat = beat;
        if (beat < LEAD_BEATS) sfx.tick();
        petRef.current?.animate([{ transform: 'scale(1.12)' }, { transform: 'scale(1)' }], {
          duration: 160,
        });
      }
      const next = notes.find((x) => !x.judged);
      if (ringRef.current) {
        if (next) {
          const k = Math.max(0, Math.min(1, (next.time - t0) / APPROACH_MS));
          ringRef.current.style.opacity = k >= 1 ? '0' : '1';
          ringRef.current.style.transform = `scale(${1 + k * 1.6})`;
        } else ringRef.current.style.opacity = '0';
      }
      if (expire(notes, t0) > 0) {
        sfx.miss();
        setFlash({ j: 'miss', id: ++flashId.current });
      }
      if (isRhythmOver(notes) && !done) {
        done = true;
        onFinish(rhythmNormalized(notes), rhythmScore(notes));
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [notes, onFinish]);

  const onTap = () => {
    const j = tap(notes, performance.now() - start.current);
    if (!j) return;
    if (j === 'perfect') sfx.perfect();
    else if (j === 'good') sfx.good();
    else sfx.miss();
    haptic.tap();
    setFlash({ j, id: ++flashId.current });
    setScore(rhythmScore(notes));
  };

  const done = notes.filter((x) => x.judged).length;
  const colors: Record<Judgement, string> = {
    perfect: 'text-emerald-600',
    good: 'text-sky-600',
    miss: 'text-rose-500',
  };
  return (
    <div className="flex h-full flex-col">
      <div className="flex justify-between px-4 py-2 text-lg font-black text-ink">
        <span>{t('mg.score', { score: n(score) })}</span>
        <span>
          {n(done)}/{n(notes.length)}
        </span>
      </div>
      <button
        type="button"
        onPointerDown={onTap}
        className="relative flex flex-1 touch-none items-center justify-center rounded-3xl bg-white/40 select-none"
        aria-label={t('mg.rhythmTap.howto')}
      >
        <div
          className="absolute size-40 rounded-full border-8 border-candy-purple/70"
          aria-hidden="true"
        />
        <div
          ref={ringRef}
          className="absolute size-40 rounded-full border-4 border-candy-pink"
          style={{ opacity: 0 }}
          aria-hidden="true"
        />
        <span ref={petRef} className="text-7xl" aria-hidden="true">
          {SPECIES_ICON[species]}
        </span>
        {flash && (
          <span
            key={flash.id}
            className={`absolute top-10 text-3xl font-black ${colors[flash.j]} ${reduced ? '' : 'anim-pop'}`}
            aria-live="polite"
          >
            {t(`mg.rhythmTap.${flash.j}`)}
          </span>
        )}
      </button>
    </div>
  );
}
