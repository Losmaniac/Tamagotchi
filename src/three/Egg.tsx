import { useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { LatheGeometry, Vector2, type Group } from 'three';
import { reactionProgress, type ReactionState } from './anim';
import { GEO } from './geometry';
import { flat, toon } from './materials';
import type { SpeciesColors } from './palette';

const EGG_H = 0.62;

/** Egg profile radius at normalised height n ∈ [-1, 1]. */
function eggRadius(n: number): number {
  const s = Math.sqrt(Math.max(0, 1 - n * n));
  return s * (n > 0 ? 0.78 - 0.12 * n : 0.82) * 0.5;
}

let eggGeometry: LatheGeometry | null = null;
function getEggGeometry() {
  if (!eggGeometry) {
    const pts: Vector2[] = [];
    for (let i = 0; i <= 32; i++) {
      const n = -Math.cos((i / 32) * Math.PI);
      pts.push(new Vector2(eggRadius(n), n * EGG_H));
    }
    eggGeometry = new LatheGeometry(pts, 40);
  }
  return eggGeometry;
}

/** Point on the egg surface: angle around Y and normalised height. */
function onEgg(theta: number, n: number, inset = 0.985): [number, number, number] {
  const r = eggRadius(n) * inset;
  return [Math.sin(theta) * r, n * EGG_H, Math.cos(theta) * r];
}

// [angle, height, size]
const SPOTS: [number, number, number][] = [
  [0.5, 0.35, 0.09],
  [-0.6, 0.05, 0.11],
  [0.15, -0.4, 0.08],
  [-0.2, 0.62, 0.065],
  [1.3, -0.15, 0.08],
  [-1.5, 0.4, 0.07],
  [2.5, 0.1, 0.1],
  [-2.6, -0.3, 0.09],
];

/** Speckled egg in the species colors; wobbles more as hatching nears. */
export function Egg({
  colors,
  progress,
  reaction,
  motion,
}: {
  colors: SpeciesColors;
  progress: number;
  reaction: RefObject<ReactionState>;
  motion: number;
}) {
  const ref = useRef<Group>(null);
  const crackPieces = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => {
        const a = (i / 10) * 2.2 - 1.1;
        return { a, tilt: i % 2 === 0 ? 0.8 : -0.8 };
      }),
    [],
  );

  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.elapsedTime;
    const nervous = 0.03 + progress * 0.12;
    let rz = Math.sin(t * (2 + progress * 6)) * nervous * motion;
    const r = reaction.current;
    const p = r ? reactionProgress(r, t) : null;
    let squash = 0;
    if (p !== null) {
      rz += Math.sin(p * Math.PI * 6) * 0.25 * (1 - p) * motion;
      squash = Math.sin(p * Math.PI) * 0.12 * motion;
    }
    g.rotation.z = rz;
    g.scale.set(1 + squash, 1 - squash, 1 + squash);
  });

  return (
    <group ref={ref} position={[0, 0.62, 0]}>
      <mesh geometry={getEggGeometry()} material={toon(colors.belly)} />
      {SPOTS.map(([theta, n, r], i) => (
        <mesh
          key={i}
          geometry={GEO.sphereLow}
          material={toon(i % 2 ? colors.body : colors.accent)}
          position={onEgg(theta, n)}
          rotation={[-n * 0.6, theta, 0]}
          scale={[r, r, r * 0.3]}
        />
      ))}
      {progress > 0.6 &&
        crackPieces.map(({ a, tilt }, i) => (
          <mesh
            key={i}
            geometry={GEO.capsule}
            material={flat('#6b5546')}
            position={onEgg(a, 0.2 + (tilt > 0 ? 0.03 : -0.03), 1.0)}
            rotation={[0, a, tilt]}
            scale={[0.009, 0.045, 0.009]}
          />
        ))}
    </group>
  );
}
