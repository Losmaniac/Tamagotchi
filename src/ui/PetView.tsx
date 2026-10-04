import { useMemo, useRef } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { isCritical, moodOf, stageProgress } from '../game/status';
import type { Pet } from '../game/types';
import type { Inventory } from '../game/shop';
import { useT } from '../i18n/useT';
import { useAppStore, type PetAction } from '../store/useAppStore';
import type { Equipped } from '../three/anim';
import { ParticleLayer, useParticleSystem } from '../three/Particles';
import { PetCanvas } from '../three/PetCanvas';
import { PetStage } from '../three/PetStage';
import { useNow, usePageVisible, useReducedMotion } from './hooks';

const STROKE_MIN_DISTANCE = 60; // px travelled over the pet
const STROKE_MAX_SPEED = 1.4; // px/ms — faster than this is a swipe, not a stroke

interface PetViewProps {
  pet: Pet;
  inventory: Inventory;
  paused: boolean;
  /** 'top' frames the pet in the upper part of the screen (shop preview). */
  framing?: 'center' | 'top';
  onAction: (a: PetAction) => void;
}

/** The 3D pet with petting gestures and lights / critical overlays. */
export function PetView({ pet, inventory, paused, framing = 'center', onAction }: PetViewProps) {
  const { t } = useT();
  const lowPower = useAppStore((s) => s.settings.lowPower);
  const reaction = useAppStore((s) => s.reaction);
  const reduced = useReducedMotion();
  const visible = usePageVisible();
  const particles = useParticleSystem(lowPower ? 0 : reduced ? 0.4 : 1);
  const now = useNow(pet.stage === 'egg' ? 1000 : 30_000);
  const gesture = useRef<{
    x: number;
    y: number;
    t: number;
    dist: number;
    stroked: boolean;
  } | null>(null);

  const look = useMemo(
    () => ({ species: pet.species, color: pet.color, stage: pet.stage, form: pet.form }),
    [pet.species, pet.color, pet.stage, pet.form],
  );
  const { hat, glasses, scarf } = inventory.equipped;
  const equipped = useMemo<Equipped>(
    () => ({
      ...(hat ? { hat } : {}),
      ...(glasses ? { glasses } : {}),
      ...(scarf ? { scarf } : {}),
    }),
    [hat, glasses, scarf],
  );
  const mood = moodOf(pet);

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    gesture.current = {
      x: e.nativeEvent.clientX,
      y: e.nativeEvent.clientY,
      t: performance.now(),
      dist: 0,
      stroked: false,
    };
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    const g = gesture.current;
    if (!g) return;
    const { clientX: x, clientY: y } = e.nativeEvent;
    g.dist += Math.hypot(x - g.x, y - g.y);
    g.x = x;
    g.y = y;
    const speed = g.dist / Math.max(1, performance.now() - g.t);
    if (
      !g.stroked &&
      g.dist > STROKE_MIN_DISTANCE &&
      speed < STROKE_MAX_SPEED &&
      pet.stage !== 'egg'
    ) {
      g.stroked = true;
      onAction('stroke');
    }
  };
  const onUp = () => {
    const g = gesture.current;
    gesture.current = null;
    if (!g || g.stroked || g.dist > 20) return;
    onAction(pet.stage === 'egg' ? 'warm' : 'poke');
  };

  const mode = !visible ? 'hidden' : paused ? 'paused' : 'running';
  const critical = isCritical(pet);
  return (
    <div className="relative min-h-0 flex-1">
      <PetCanvas
        className="absolute inset-0"
        lowPower={lowPower}
        mode={mode}
        cameraZ={framing === 'top' ? 9.5 : 4.1}
        lookAtY={framing === 'top' ? -1.05 : 0.8}
        label={`${pet.name}, ${t(`stage.${pet.stage}`)}`}
      >
        <PetStage
          look={look}
          mood={mood}
          reaction={reaction}
          equipped={equipped}
          poops={pet.poops}
          eggProgress={pet.stage === 'egg' ? stageProgress(pet, now) : 0}
          motion={reduced ? 0.3 : 1}
          shadow={!lowPower}
          particles={particles}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
        />
        <ParticleLayer system={particles} />
      </PetCanvas>
      {!pet.lightsOn && (
        <div
          className="pointer-events-none absolute inset-0 bg-indigo-950/60 transition-opacity"
          aria-hidden="true"
        >
          <span className="absolute top-6 left-8 text-xl opacity-80">✦</span>
          <span className="absolute top-16 right-10 text-sm opacity-70">✦</span>
          <span className="absolute top-10 right-24 text-3xl">🌙</span>
        </div>
      )}
      {critical && (
        <div
          className="anim-pulse pointer-events-none absolute inset-0 rounded-3xl"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
