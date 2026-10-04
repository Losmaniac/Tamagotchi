import { useRef, useState, type PointerEvent } from 'react';
import { NAME_MAX_LENGTH, sanitizeName } from '../game/pet';
import { COLOR_VARIANTS, SPECIES, type ColorVariant } from '../game/types';
import { useT } from '../i18n/useT';
import { useAppStore } from '../store/useAppStore';
import type { Reaction } from '../three/anim';
import { SPECIES_THEMES, themeGradient } from '../three/palette';
import { ParticleLayer, useParticleSystem } from '../three/Particles';
import { PetCanvas } from '../three/PetCanvas';
import { PetStage } from '../three/PetStage';
import { LanguageToggle } from './components/LanguageToggle';
import { usePageVisible, useReducedMotion } from './hooks';

let rid = 0;

/** Pick a species (swipe/arrows), one of 3 colors and a name, then hatch. */
export function SelectScreen() {
  const { t } = useT();
  const createEgg = useAppStore((s) => s.createEgg);
  const lowPower = useAppStore((s) => s.settings.lowPower);
  const reduced = useReducedMotion();
  const visible = usePageVisible();
  const [index, setIndex] = useState(0);
  const [color, setColor] = useState<ColorVariant>(0);
  const [name, setName] = useState('');
  const [reaction, setReaction] = useState<Reaction | null>({ kind: 'hop', id: ++rid });
  const particles = useParticleSystem(lowPower ? 0 : reduced ? 0.4 : 1);
  const drag = useRef<{ x: number; moved: boolean } | null>(null);

  const species = SPECIES[index]!;
  const go = (dir: 1 | -1) => {
    setIndex((i) => (i + dir + SPECIES.length) % SPECIES.length);
    setReaction({ kind: 'hop', id: ++rid });
  };

  const onDown = (e: PointerEvent) => {
    drag.current = { x: e.clientX, moved: false };
  };
  const onUp = (e: PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    else setReaction({ kind: 'poke', id: ++rid });
  };

  const trimmed = sanitizeName(name);
  const hatch = () => {
    if (!trimmed) return;
    createEgg(species, color, trimmed);
  };

  return (
    <main
      className="safe-area flex h-full flex-col transition-[background] duration-500"
      style={{ background: themeGradient(species) }}
    >
      <header className="flex items-start justify-between gap-2 px-4 pt-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-ink">{t('select.title')}</h1>
          <p className="font-semibold text-ink/70">{t('select.subtitle')}</p>
        </div>
        <LanguageToggle compact />
      </header>

      <section className="relative min-h-0 flex-1" aria-roledescription="carousel">
        <div
          className="absolute inset-0"
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerCancel={() => (drag.current = null)}
        >
          <PetCanvas
            className="h-full w-full"
            lowPower={lowPower}
            mode={visible ? 'running' : 'hidden'}
            label={t(`species.${species}`)}
            cameraZ={4.4}
          >
            <PetStage
              look={{ species, color, stage: 'child', form: 'normal' }}
              mood="happy"
              reaction={reaction}
              motion={reduced ? 0.3 : 1}
              shadow={!lowPower}
              particles={particles}
            />
            <ParticleLayer system={particles} />
          </PetCanvas>
        </div>
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label={t('select.prev')}
          className="absolute top-1/2 left-3 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-2xl font-black text-ink shadow-md active:scale-95"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label={t('select.next')}
          className="absolute top-1/2 right-3 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-2xl font-black text-ink shadow-md active:scale-95"
        >
          ›
        </button>
      </section>

      <section className="flex flex-col items-center gap-3 px-4 pb-4">
        <div className="text-center" aria-live="polite">
          <h2 className="text-2xl font-black text-ink">{t(`species.${species}`)}</h2>
          <div className="mt-1 flex justify-center gap-1.5" aria-hidden="true">
            {SPECIES.map((s, i) => (
              <span
                key={s}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-ink/70' : 'w-2 bg-ink/25'}`}
              />
            ))}
          </div>
        </div>

        <div role="radiogroup" aria-label={t('select.color')} className="flex gap-3">
          {COLOR_VARIANTS.map((c) => {
            const v = SPECIES_THEMES[species].variants[c];
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                aria-label={t('select.colorN', { n: c + 1 })}
                onClick={() => {
                  setColor(c);
                  setReaction({ kind: 'poke', id: ++rid });
                }}
                className={`flex size-12 items-center justify-center rounded-full border-4 shadow-md transition active:scale-95 ${
                  color === c ? 'scale-110 border-white' : 'border-white/40'
                }`}
                style={{ background: `linear-gradient(135deg, ${v.body} 55%, ${v.accent} 55%)` }}
              >
                {color === c && (
                  <span className="text-lg font-black text-white drop-shadow">✓</span>
                )}
              </button>
            );
          })}
        </div>

        <label className="w-full max-w-sm">
          <span className="sr-only">{t('select.name')}</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(Array.from(e.target.value).slice(0, NAME_MAX_LENGTH).join(''))}
            onKeyDown={(e) => e.key === 'Enter' && hatch()}
            placeholder={t('select.namePlaceholder')}
            aria-describedby="name-hint"
            autoComplete="off"
            enterKeyHint="go"
            className="h-14 w-full rounded-2xl border-2 border-white/80 bg-white/80 px-4 text-center text-lg font-bold text-ink shadow-inner outline-none placeholder:text-ink/40 focus:border-candy-pink"
          />
          <span id="name-hint" className="mt-1 block text-center text-xs font-semibold text-ink/60">
            {t('select.nameHint')} · {Array.from(name).length}/{NAME_MAX_LENGTH}
          </span>
        </label>

        <button
          type="button"
          onClick={hatch}
          disabled={!trimmed}
          className="h-14 w-full max-w-sm rounded-2xl bg-candy-pink text-xl font-black text-white shadow-lg transition active:scale-[0.98] disabled:opacity-50"
        >
          {t('select.hatch')} 🥚
        </button>
      </section>
    </main>
  );
}
