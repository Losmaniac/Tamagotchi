import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { MeshBasicMaterial, type Group, type Mesh } from 'three';
import type { Mood } from '../game/status';
import {
  reactionProgress,
  type Equipped,
  type PetLook,
  type Pose,
  type Reaction,
  type ReactionState,
} from './anim';
import { Egg } from './Egg';
import { faceForMood } from './Face';
import { GEO } from './geometry';
import { flat, getMaterialQuality, toon } from './materials';
import { mix, resolveColors, SICK_TINT, SPECIES_THEMES } from './palette';
import type { ParticleSystem } from './Particles';
import { PetModel } from './PetModel';
import { Poops, POOP_SLOTS } from './Poop';
import { spriteTexture } from './sprites';

const STAGE_SCALE = { egg: 1, baby: 0.78, child: 0.9, teen: 1, adult: 1.08, senior: 1.04 } as const;

export interface PetStageProps {
  look: PetLook;
  mood: Mood;
  reaction?: Reaction | null;
  equipped?: Equipped;
  poops?: number;
  eggProgress?: number;
  /** 1 = full animation, lower for prefers-reduced-motion. */
  motion?: number;
  /** Soft blob shadow under the pet (off in low-power mode). */
  shadow?: boolean;
  particles?: ParticleSystem;
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerMove?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerUp?: (e: ThreeEvent<PointerEvent>) => void;
}

/** Hit area material: invisible but still raycastable. */
const hitMaterial = flat('#000000', 0);
hitMaterial.depthWrite = false;
hitMaterial.colorWrite = false;

/** The pet plus everything that animates it: mood poses, reactions and particles. */
export function PetStage({
  look,
  mood,
  reaction,
  equipped = {},
  poops = 0,
  eggProgress = 0,
  motion = 1,
  shadow = true,
  particles,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: PetStageProps) {
  const clock = useThree((s) => s.clock);
  const rig = useRef<Group>(null);
  const shadowRef = useRef<Mesh>(null);
  const shadowMat = useMemo(
    () =>
      new MeshBasicMaterial({
        map: spriteTexture('shadow'),
        transparent: true,
        depthWrite: false,
        opacity: 0.5,
      }),
    [],
  );
  const reactionState = useRef<ReactionState>({ kind: null, start: 0 });
  const pose = useRef<Pose>({ droop: 0, tilt: 0 });
  const timers = useRef<{ z: number; stink: number; sparkle: number; bolt?: number }>({
    z: 0,
    stink: 0,
    sparkle: 0,
  });

  const colors = useMemo(() => {
    const c = resolveColors(look.species, look.color, look.form, look.stage);
    if (mood !== 'sick') return c;
    return {
      ...c,
      body: mix(c.body, SICK_TINT, 0.4),
      belly: mix(c.belly, SICK_TINT, 0.3),
      accent: mix(c.accent, SICK_TINT, 0.3),
    };
  }, [look.species, look.color, look.form, look.stage, mood]);

  const face = useMemo(
    () => faceForMood(mood, look.form === 'grumpy', look.stage === 'senior'),
    [mood, look.form, look.stage],
  );

  // Trigger reaction animations + bursts.
  useEffect(() => {
    if (!reaction) return;
    reactionState.current = { kind: reaction.kind, start: clock.elapsedTime };
    if (!particles) return;
    const head: [number, number, number] = [0, 1.3, 0.4];
    switch (reaction.kind) {
      case 'stroke':
        particles.emit('heart', 3, { origin: head, up: 0.7, size: 0.2 });
        break;
      case 'eat':
        particles.emit('crumb', 6, {
          origin: [0, 0.95, 0.5],
          up: 0.4,
          gravity: 2.5,
          size: 0.09,
          life: 0.9,
        });
        break;
      case 'snack':
        particles.emit('crumb', 4, {
          origin: [0, 0.95, 0.5],
          up: 0.4,
          gravity: 2.5,
          size: 0.08,
          life: 0.8,
        });
        particles.emit('heart', 2, { origin: head, up: 0.6, size: 0.16 });
        break;
      case 'hop':
      case 'play':
        particles.emit('sparkle', 5, { origin: [0, 0.8, 0.3], spread: 1.2, up: 0.9, size: 0.16 });
        break;
      case 'clean':
        particles.emit('bubble', 12, {
          origin: [0, 0.5, 0.3],
          spread: 1.6,
          up: 0.7,
          size: 0.18,
          life: 1.6,
          sway: 0.4,
        });
        break;
      case 'medicine':
        particles.emit('sparkle', 6, { origin: head, spread: 0.8, up: 0.5, size: 0.14 });
        break;
      case 'evolve':
        particles.emit('star', 14, {
          origin: [0, 0.9, 0.2],
          spread: 2,
          up: 1.2,
          size: 0.2,
          life: 1.6,
        });
        break;
      default:
        break;
    }
  }, [reaction, clock, particles]);

  useFrame(({ clock: c }, rawDelta) => {
    const g = rig.current;
    if (!g) return;
    const delta = Math.min(rawDelta, 0.05);
    const t = c.elapsedTime;
    const m = motion;
    let y = 0;
    let sx = 1;
    let sy = 1;
    let rotY = 0;
    let rotZ = 0;

    // Idle breathing.
    const asleep = mood === 'sleeping';
    const breath = Math.sin(t * (asleep ? 1.2 : 2.2)) * (asleep ? 0.035 : 0.022) * Math.max(m, 0.3);
    sy += breath;
    sx -= breath * 0.5;

    // Mood poses.
    let droop = 0;
    let tilt = 0;
    switch (mood) {
      case 'happy': {
        const ph = t % 3.6;
        if (ph < 0.5) y += Math.sin((ph / 0.5) * Math.PI) * 0.12 * m;
        break;
      }
      case 'sad':
      case 'critical':
        droop = 1;
        sy *= 0.95;
        break;
      case 'sleeping':
        droop = 0.6;
        tilt = 0.25;
        break;
      case 'sick':
        rotZ += Math.sin(t * 3) * 0.08 * m;
        droop = 0.5;
        break;
      case 'grumpy': {
        const stomp = Math.abs(Math.sin(t * 7)) * 0.04 * m;
        y += stomp;
        rotZ += Math.sin(t * 14) * 0.03 * m;
        break;
      }
      case 'dirty':
        tilt = Math.sin(t * 0.8) * 0.08;
        break;
      default:
        break;
    }
    pose.current.droop = droop;
    pose.current.tilt = tilt;

    // Reactions.
    const r = reactionState.current;
    const p = reactionProgress(r, t);
    if (p !== null) {
      const fade = 1 - p;
      switch (r.kind) {
        case 'poke': {
          const s = Math.sin(p * Math.PI) * 0.22 * m;
          sy *= 1 - s;
          sx *= 1 + s * 0.8;
          break;
        }
        case 'hop':
        case 'play': {
          const hop = Math.abs(Math.sin(p * Math.PI * 2));
          y += hop * 0.35 * m;
          const land = Math.max(0, 0.25 - hop) * 0.6 * m;
          sy *= 1 - land + hop * 0.06 * m;
          sx *= 1 + land;
          break;
        }
        case 'eat':
        case 'snack':
          sy *= 1 + Math.sin(p * Math.PI * 10) * 0.03 * m;
          break;
        case 'stroke':
          rotZ += Math.sin(p * Math.PI * 3) * 0.08 * m;
          sy *= 1 + Math.sin(p * Math.PI) * 0.05;
          break;
        case 'refuse':
        case 'scold':
          rotY += Math.sin(p * Math.PI * 7) * 0.35 * fade * m;
          break;
        case 'medicine':
          rotZ += Math.sin(p * Math.PI * 12) * 0.06 * fade * m;
          break;
        case 'clean':
          rotY += Math.sin(p * Math.PI * 4) * 0.25 * fade * m;
          break;
        case 'yawn': {
          const st = Math.sin(p * Math.PI);
          sy *= 1 + st * 0.07 * m;
          sx *= 1 - st * 0.03 * m;
          rotZ += st * 0.06 * m;
          break;
        }
        case 'evolve':
          rotY += p * Math.PI * 2 * (m > 0.5 ? 1 : 0);
          y += Math.sin(p * Math.PI) * 0.3 * m;
          break;
        default:
          break;
      }
    }

    const base = STAGE_SCALE[look.stage];
    g.position.y = y;
    g.rotation.y = rotY;
    g.rotation.z = rotZ;
    g.scale.set(base * sx, base * sy, base * sx);
    const sh = shadowRef.current;
    if (sh) {
      const lift = Math.min(1, y / 0.5);
      const w = (look.stage === 'egg' ? 1.0 : 1.35) * base * (1 - lift * 0.35) * sx;
      sh.scale.set(w, w * 0.62, 1);
      (sh.material as MeshBasicMaterial).opacity = 0.5 * (1 - lift * 0.55);
    }

    // Continuous particles.
    if (particles) {
      const tm = timers.current;
      tm.bolt = (tm.bolt ?? 0) + delta;
      if (
        look.species === 'sparky' &&
        (mood === 'happy' || mood === 'content') &&
        look.stage !== 'egg' &&
        tm.bolt > 1.8
      ) {
        tm.bolt = 0;
        particles.emit('bolt', 1, {
          origin: [(Math.random() - 0.5) * 0.9, 1.5 * base, 0.2],
          spread: 0.2,
          up: 0.5,
          size: 0.14,
          life: 0.9,
        });
      }
      tm.z += delta;
      tm.stink += delta;
      tm.sparkle += delta;
      if (asleep && tm.z > 1.3) {
        tm.z = 0;
        particles.emit('z', 1, {
          origin: [0.35, 1.55 * base, 0.2],
          spread: 0.1,
          up: 0.35,
          size: 0.2,
          life: 2.2,
          sway: 0.15,
        });
      }
      if ((poops > 0 || mood === 'dirty') && tm.stink > 0.9) {
        tm.stink = 0;
        const slot =
          poops > 0
            ? POOP_SLOTS[Math.floor(Math.random() * Math.min(poops, POOP_SLOTS.length))]
            : null;
        const origin: [number, number, number] = slot ? [slot[0], 0.35, slot[1]] : [0.3, 1.2, 0.2];
        particles.emit('stink', 1, {
          origin,
          spread: 0.15,
          up: 0.35,
          size: 0.18,
          life: 1.6,
          sway: 0.2,
        });
      }
      if (look.form === 'star' && look.stage !== 'egg' && mood !== 'sleeping' && tm.sparkle > 2.6) {
        tm.sparkle = 0;
        particles.emit('sparkle', 2, {
          origin: [0, 1.0, 0.3],
          spread: 1.4,
          up: 0.3,
          size: 0.12,
          life: 1.2,
        });
      }
    }
  });

  const liveliness =
    mood === 'happy' ? 1 : mood === 'content' ? 0.7 : mood === 'sleeping' ? 0 : 0.3;

  return (
    <group>
      <group ref={rig}>
        {look.stage === 'egg' ? (
          <Egg colors={colors} progress={eggProgress} reaction={reactionState} motion={motion} />
        ) : (
          <PetModel
            species={look.species}
            colors={colors}
            stage={look.stage}
            star={look.form === 'star'}
            face={face}
            pose={pose}
            reaction={reactionState}
            equipped={equipped}
            motion={motion}
            liveliness={liveliness}
          />
        )}
      </group>
      {shadow && (
        <mesh
          ref={shadowRef}
          material={shadowMat}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.003, 0.05]}
          renderOrder={-1}
        >
          <planeGeometry args={[1, 1]} />
        </mesh>
      )}
      {getMaterialQuality() === 'plush' && (
        // Soft ground platform tinted from the species' background.
        <group position={[0, -0.045, 0]}>
          <mesh
            geometry={GEO.disc}
            material={toon(mix(SPECIES_THEMES[look.species].background[1], '#4a3a78', 0.5))}
            scale={[0.62, 0.06, 0.62]}
          />
          <mesh
            geometry={GEO.disc}
            material={toon(mix(SPECIES_THEMES[look.species].background[1], '#6c5a9e', 0.32))}
            position={[0, 0.028, 0]}
            scale={[0.57, 0.005, 0.57]}
          />
        </group>
      )}
      <Poops count={poops} />
      <mesh
        geometry={GEO.sphereLow}
        material={hitMaterial}
        position={[0, 0.8, 0]}
        scale={[0.8, 0.9, 0.7]}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
    </group>
  );
}
