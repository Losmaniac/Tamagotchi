import { useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { Mood } from '../game/status';
import { reactionProgress, type ReactionState } from './anim';
import { GEO } from './geometry';
import { flat, gloss } from './materials';

export type EyeKind = 'open' | 'happy' | 'closed' | 'half';
export type MouthKind = 'smile' | 'open' | 'frown' | 'flat' | 'pout';
export type BrowKind = 'none' | 'angry' | 'sad' | 'grey';

export interface FaceState {
  eyes: EyeKind;
  mouth: MouthKind;
  brows: BrowKind;
  sweat?: boolean;
}

export const HEAD_R = 0.55;
/** Head ellipsoid scale; face features sit on its surface. */
export const HEAD_SCALE: [number, number, number] = [1.08, 0.95, 1];

/** Point on the front of the head ellipsoid (head-local coordinates). */
export function onHead(x: number, y: number, lift = 0): [number, number, number] {
  const rx = HEAD_R * HEAD_SCALE[0];
  const ry = HEAD_R * HEAD_SCALE[1];
  const rz = HEAD_R * HEAD_SCALE[2];
  const k = Math.max(0, 1 - (x / rx) ** 2 - (y / ry) ** 2);
  return [x, y, Math.sqrt(k) * rz + lift];
}

export function faceForMood(mood: Mood, grumpyForm: boolean, senior: boolean): FaceState {
  const baseBrows: BrowKind = grumpyForm ? 'angry' : senior ? 'grey' : 'none';
  switch (mood) {
    case 'sleeping':
      return { eyes: 'closed', mouth: 'pout', brows: baseBrows };
    case 'sick':
      return { eyes: 'open', mouth: 'flat', brows: 'sad', sweat: true };
    case 'critical':
      return { eyes: 'open', mouth: 'frown', brows: 'sad', sweat: true };
    case 'sad':
      return { eyes: 'open', mouth: 'frown', brows: 'sad' };
    case 'grumpy':
      return { eyes: 'open', mouth: 'pout', brows: 'angry' };
    case 'dirty':
      return { eyes: 'half', mouth: 'flat', brows: baseBrows };
    case 'happy':
      return { eyes: 'open', mouth: grumpyForm ? 'flat' : 'open', brows: baseBrows };
    default:
      return { eyes: 'open', mouth: grumpyForm ? 'flat' : 'smile', brows: baseBrows };
  }
}

const INK = '#2b1a3d';
const EYE_X = 0.2;
const EYE_Y = 0.02;

function Eye({ kind, side, iris }: { kind: EyeKind; side: -1 | 1; iris?: string }) {
  const pos = onHead(side * EYE_X, EYE_Y, 0.005);
  const rotY = Math.asin((side * EYE_X) / HEAD_R) * 0.9;
  const ink = flat(INK);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {kind === 'open' && (
        <>
          {iris ? (
            <>
              {/* Detailed eye: coloured iris ring, glossy pupil, sparkly highlights. */}
              <mesh
                geometry={GEO.sphere}
                material={gloss('#241536')}
                scale={[0.088, 0.112, 0.04]}
              />
              <mesh
                geometry={GEO.sphere}
                material={gloss(iris)}
                position={[0, -0.012, 0.012]}
                scale={[0.07, 0.085, 0.035]}
              />
              <mesh
                geometry={GEO.sphere}
                material={gloss('#120a1c')}
                position={[0, -0.006, 0.022]}
                scale={[0.042, 0.055, 0.03]}
              />
            </>
          ) : (
            <mesh geometry={GEO.sphere} material={ink} scale={[0.085, 0.11, 0.04]} />
          )}
          <mesh
            geometry={GEO.sphereLow}
            material={flat('#ffffff')}
            position={[-0.028 * side, 0.04, 0.05]}
            scale={0.03}
          />
          <mesh
            geometry={GEO.sphereLow}
            material={flat('#ffffff')}
            position={[0.025 * side, -0.035, 0.05]}
            scale={0.015}
          />
        </>
      )}
      {kind === 'half' && (
        <>
          <mesh
            geometry={GEO.sphere}
            material={ink}
            position={[0, -0.03, 0]}
            scale={[0.085, 0.05, 0.04]}
          />
          <mesh
            geometry={GEO.capsule}
            material={ink}
            position={[0, 0.02, 0.02]}
            rotation={[0, 0, Math.PI / 2]}
            scale={[0.014, 0.12, 0.014]}
          />
        </>
      )}
      {kind === 'happy' && (
        <mesh
          geometry={GEO.arc}
          material={ink}
          scale={[0.075, 0.075, 0.06]}
          position={[0, -0.03, 0.01]}
        />
      )}
      {kind === 'closed' && (
        <mesh
          geometry={GEO.arc}
          material={ink}
          rotation={[0, 0, Math.PI]}
          scale={[0.075, 0.06, 0.06]}
          position={[0, 0.02, 0.01]}
        />
      )}
    </group>
  );
}

function Mouth({ kind, y, z }: { kind: MouthKind; y: number; z: number }) {
  const ink = flat(INK);
  const pos: [number, number, number] = [0, y, z];
  switch (kind) {
    case 'smile':
      return (
        <mesh
          geometry={GEO.arc}
          material={ink}
          position={pos}
          rotation={[0, 0, Math.PI]}
          scale={[0.06, 0.05, 0.05]}
        />
      );
    case 'frown':
      return (
        <mesh
          geometry={GEO.arc}
          material={ink}
          position={[0, y - 0.03, z]}
          scale={[0.055, 0.04, 0.05]}
        />
      );
    case 'flat':
      return (
        <mesh
          geometry={GEO.capsule}
          material={ink}
          position={pos}
          rotation={[0, 0, Math.PI / 2]}
          scale={[0.012, 0.07, 0.012]}
        />
      );
    case 'pout':
      return (
        <mesh geometry={GEO.ring} material={ink} position={pos} scale={[0.025, 0.025, 0.02]} />
      );
    case 'open':
      return (
        <group position={[0, y - 0.01, z - 0.01]}>
          <mesh geometry={GEO.sphere} material={flat('#5a1f3d')} scale={[0.07, 0.06, 0.03]} />
          <mesh
            geometry={GEO.sphere}
            material={flat('#ff7a9c')}
            position={[0, -0.025, 0.012]}
            scale={[0.045, 0.025, 0.02]}
          />
        </group>
      );
  }
}

function Brows({ kind, color }: { kind: BrowKind; color: string }) {
  if (kind === 'none') return null;
  const mat = flat(kind === 'grey' ? '#e6e3ea' : color);
  const thick = kind === 'grey' ? 0.024 : 0.016;
  return (
    <>
      {([-1, 1] as const).map((side) => {
        const angle = kind === 'angry' ? 0.45 * side : kind === 'sad' ? -0.4 * side : -0.1 * side;
        return (
          <mesh
            key={side}
            geometry={GEO.capsule}
            material={mat}
            position={onHead(side * EYE_X, EYE_Y + 0.17, 0.01)}
            rotation={[0, 0, Math.PI / 2 + angle]}
            scale={[thick, 0.075, thick]}
          />
        );
      })}
    </>
  );
}

interface FaceProps {
  face: FaceState;
  reaction: RefObject<ReactionState>;
  blush: string;
  mouthY?: number;
  mouthLift?: number;
  browColor?: string;
  /** Coloured iris (detailed look); plain dark eyes when omitted. */
  iris?: string;
}

/**
 * Eyes, mouth, brows and blush. Variants are swapped per mood; blinking, chomping
 * and happy-squint reactions toggle visibility per frame without re-rendering.
 */
export function Face({
  face,
  reaction,
  blush,
  mouthY = -0.17,
  mouthLift = 0.01,
  browColor = INK,
  iris,
}: FaceProps) {
  const eyesRef = useRef<Group>(null);
  const baseEyes = useRef<Group>(null);
  const happyEyes = useRef<Group>(null);
  const closedEyes = useRef<Group>(null);
  const baseMouth = useRef<Group>(null);
  const chompMouth = useRef<Group>(null);
  const nextBlink = useRef(-1);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const r = reaction.current;
    const p = r ? reactionProgress(r, t) : null;
    const chomping = p !== null && (r?.kind === 'eat' || r?.kind === 'snack');
    const yawning = p !== null && r?.kind === 'yawn';
    const squint =
      p !== null &&
      (r?.kind === 'stroke' || r?.kind === 'hop' || r?.kind === 'play' || r?.kind === 'evolve');

    if (baseMouth.current && chompMouth.current) {
      const open = yawning ? p! > 0.15 && p! < 0.8 : chomping && Math.floor(t * 9) % 2 === 0;
      baseMouth.current.visible = !open;
      chompMouth.current.visible = open;
    }
    if (baseEyes.current && happyEyes.current && closedEyes.current) {
      const showHappy = squint && face.eyes !== 'closed';
      baseEyes.current.visible = !showHappy && !yawning;
      happyEyes.current.visible = showHappy && !yawning;
      closedEyes.current.visible = yawning;
    }
    // Blink (only for open eyes).
    if (nextBlink.current < 0) nextBlink.current = t + 1 + Math.random() * 3;
    if (eyesRef.current) {
      if (t > nextBlink.current + 0.13) nextBlink.current = t + 2.5 + Math.random() * 3.5;
      const blinking = face.eyes === 'open' && t > nextBlink.current;
      eyesRef.current.scale.y = blinking ? 0.12 : 1;
    }
  });

  const mouthZ = onHead(0, mouthY, mouthLift)[2];
  return (
    <group>
      <group ref={eyesRef} position={[0, EYE_Y, 0]}>
        <group position={[0, -EYE_Y, 0]}>
          <group ref={baseEyes}>
            <Eye kind={face.eyes} side={-1} {...(iris ? { iris } : {})} />
            <Eye kind={face.eyes} side={1} {...(iris ? { iris } : {})} />
          </group>
          <group ref={happyEyes} visible={false}>
            <Eye kind="happy" side={-1} />
            <Eye kind="happy" side={1} />
          </group>
          <group ref={closedEyes} visible={false}>
            <Eye kind="closed" side={-1} />
            <Eye kind="closed" side={1} />
          </group>
        </group>
      </group>
      <Brows kind={face.brows} color={browColor} />
      <group ref={baseMouth}>
        <Mouth kind={face.mouth} y={mouthY} z={mouthZ} />
      </group>
      <group ref={chompMouth} visible={false}>
        <Mouth kind="open" y={mouthY} z={mouthZ} />
      </group>
      {face.sweat && (
        <group position={onHead(0.4, 0.22, 0.02)} rotation={[0, 0.7, -0.2]}>
          <mesh
            geometry={GEO.sphereLow}
            material={flat('#7cc8ff', 0.9)}
            scale={[0.045, 0.05, 0.03]}
          />
          <mesh
            geometry={GEO.cone}
            material={flat('#7cc8ff', 0.9)}
            position={[0, 0.055, 0]}
            scale={[0.04, 0.07, 0.025]}
          />
        </group>
      )}
      {([-1, 1] as const).map((side) => (
        <mesh
          key={side}
          geometry={GEO.sphereLow}
          material={flat(blush, 0.55)}
          position={onHead(side * 0.34, -0.1, -0.01)}
          rotation={[0, side * 0.6, 0]}
          scale={[0.075, 0.045, 0.02]}
        />
      ))}
    </group>
  );
}
