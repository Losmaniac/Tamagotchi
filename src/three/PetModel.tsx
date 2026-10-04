// Procedural chibi pets built from primitives (big head, small body).
// Each species is a small config in MODEL_REGISTRY; a .glb-based component with the
// same props (PetModelProps) could replace any entry later without touching the rig.

import { useRef, type ComponentType, type ReactNode, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { CatmullRomCurve3, Shape, ShapeGeometry, TubeGeometry, Vector3, type Group } from 'three';
import type { Species, Stage } from '../game/types';
import { Accessories } from './Accessories';
import type { Equipped, Pose, ReactionState } from './anim';
import { Face, HEAD_R, HEAD_SCALE, onHead, type FaceState } from './Face';
import { GEO } from './geometry';
import { flat, toon } from './materials';
import type { SpeciesColors } from './palette';

export interface PetModelProps {
  colors: SpeciesColors;
  stage: Stage;
  star: boolean;
  face: FaceState;
  pose: RefObject<Pose>;
  reaction: RefObject<ReactionState>;
  equipped: Equipped;
  /** Animation intensity 0–1 (reduced motion lowers it). */
  motion: number;
  /** 0–1 how lively tails/wings move (happy = 1, sad/sleep = low). */
  liveliness: number;
}

interface PartProps {
  c: SpeciesColors;
  stage: Stage;
  motion: number;
  liveliness: number;
}

interface SpeciesConfig {
  /** Ears/horns etc. in head-local space. */
  Head: ComponentType<PartProps>;
  /** Snouts, patches, whiskers in head-local space (drawn with the face). */
  Face?: ComponentType<PartProps>;
  /** Tails, wings, spikes in body-local space. */
  Body?: ComponentType<PartProps>;
  mouthY?: number;
  mouthLift?: number;
  limbColor?: (c: SpeciesColors) => string;
}

const BODY_Y = 0.42;
const HEAD_Y = 1.12;
const INK = '#2b1a3d';
const isYoung = (s: Stage) => s === 'baby' || s === 'child';

// --- Animated helpers ------------------------------------------------------

function Wag({
  children,
  speed,
  amount,
  axis = 'y',
  motion,
  liveliness,
  ...rest
}: {
  children: ReactNode;
  speed: number;
  amount: number;
  axis?: 'x' | 'y' | 'z';
  motion: number;
  liveliness: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const ref = useRef<Group>(null);
  const base = rest.rotation ?? [0, 0, 0];
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const live = 0.25 + 0.75 * liveliness;
    const a = Math.sin(clock.elapsedTime * speed * live) * amount * motion * live;
    const i = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    ref.current.rotation.set(base[0], base[1], base[2]);
    ref.current.rotation[axis] = (base[i] ?? 0) + a;
  });
  return (
    <group ref={ref} position={rest.position}>
      {children}
    </group>
  );
}

const tubeCache = new Map<string, TubeGeometry>();
/** Shared tube geometry (tails), built once per key. */
function getTube(key: string, points: [number, number, number][], radius: number) {
  let geo = tubeCache.get(key);
  if (!geo) {
    const curve = new CatmullRomCurve3(points.map((p) => new Vector3(...p)));
    geo = new TubeGeometry(curve, 24, radius, 10, false);
    tubeCache.set(key, geo);
  }
  return geo;
}

let wingGeometry: ShapeGeometry | null = null;
function getWingGeometry() {
  if (!wingGeometry) {
    const s = new Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(0.15, 0.35, 0.45, 0.55, 0.7, 0.5);
    s.quadraticCurveTo(0.6, 0.35, 0.62, 0.22);
    s.quadraticCurveTo(0.48, 0.2, 0.45, 0.06);
    s.quadraticCurveTo(0.3, 0.08, 0.25, -0.05);
    s.quadraticCurveTo(0.12, 0.02, 0, 0);
    wingGeometry = new ShapeGeometry(s, 16);
  }
  return wingGeometry;
}

let starGeometry: ShapeGeometry | null = null;
function getStarGeometry() {
  if (!starGeometry) {
    const s = new Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 1 : 0.45;
      const a = (i * Math.PI) / 5 + Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    starGeometry = new ShapeGeometry(s);
  }
  return starGeometry;
}

// --- Species parts ------------------------------------------------------------

function CatHead({ c, stage }: PartProps) {
  const k = isYoung(stage) ? 0.85 : 1;
  return (
    <>
      {([-1, 1] as const).map((s) => (
        <group key={s} position={[s * 0.3, 0.42, -0.02]} rotation={[0, 0, -s * 0.38]} scale={k}>
          <mesh
            geometry={GEO.cone}
            material={toon(c.body)}
            scale={[0.17, 0.32, 0.12]}
            position={[0, 0.12, 0]}
          />
          <mesh
            geometry={GEO.cone}
            material={toon(c.pink)}
            scale={[0.1, 0.2, 0.05]}
            position={[0, 0.08, 0.06]}
          />
        </group>
      ))}
    </>
  );
}

function CatFace({ c }: PartProps) {
  return (
    <>
      <mesh
        geometry={GEO.sphereLow}
        material={toon(c.pink)}
        position={onHead(0, -0.09, 0.01)}
        scale={[0.04, 0.03, 0.03]}
      />
      {([-1, 1] as const).map((s) =>
        [-0.06, 0, 0.06].map((dy, i) => (
          <mesh
            key={`${s}${i}`}
            geometry={GEO.cylinder}
            material={flat(INK, 0.6)}
            position={[s * 0.44, -0.12 + dy, onHead(s * 0.36, -0.12)[2] - 0.04]}
            rotation={[0, 0, Math.PI / 2 + s * dy * 2.5]}
            scale={[0.006, 0.18, 0.006]}
          />
        )),
      )}
    </>
  );
}

function CatBody({ c, stage, motion, liveliness }: PartProps) {
  const tube = getTube(
    'cat',
    [
      [0, 0, 0],
      [0.12, 0.12, -0.12],
      [0.18, 0.38, -0.18],
      [0.08, 0.55, -0.16],
    ],
    0.055,
  );
  const k = stage === 'baby' ? 0.7 : 1;
  return (
    <Wag
      position={[0.05, -0.2, -0.3]}
      speed={2.2}
      amount={0.35}
      axis="z"
      motion={motion}
      liveliness={liveliness}
    >
      <group scale={k}>
        <mesh geometry={tube} material={toon(c.body)} />
        <mesh
          geometry={GEO.sphereLow}
          material={toon(c.accent)}
          position={[0.08, 0.55, -0.16]}
          scale={0.065}
        />
      </group>
    </Wag>
  );
}

function DogHead({ c, stage, motion, liveliness }: PartProps) {
  const k = isYoung(stage) ? 0.85 : 1;
  return (
    <>
      {([-1, 1] as const).map((s) => (
        <Wag
          key={s}
          position={[s * 0.5, 0.18, 0]}
          rotation={[0, 0, s * 0.35]}
          speed={3}
          amount={0.08}
          axis="z"
          motion={motion}
          liveliness={liveliness}
        >
          <mesh
            geometry={GEO.sphere}
            material={toon(c.accent)}
            scale={[0.13 * k, 0.27 * k, 0.09]}
            position={[0, -0.16 * k, 0]}
          />
        </Wag>
      ))}
    </>
  );
}

function DogFace({ c }: PartProps) {
  return (
    <>
      <mesh
        geometry={GEO.sphere}
        material={toon(c.belly)}
        position={onHead(0, -0.15, -0.1)}
        scale={[0.2, 0.14, 0.14]}
      />
      <mesh
        geometry={GEO.sphere}
        material={flat(INK)}
        position={onHead(0, -0.08, 0.05)}
        scale={[0.06, 0.045, 0.04]}
      />
    </>
  );
}

function DogBody({ c, motion, liveliness }: PartProps) {
  return (
    <Wag
      position={[0, -0.05, -0.32]}
      rotation={[-0.7, 0, 0]}
      speed={9}
      amount={0.5}
      axis="z"
      motion={motion}
      liveliness={liveliness}
    >
      <mesh
        geometry={GEO.capsule}
        material={toon(c.body)}
        position={[0, 0.12, 0]}
        scale={[0.05, 0.12, 0.05]}
      />
    </Wag>
  );
}

function BunnyHead({ c, stage, motion, liveliness }: PartProps) {
  const k = stage === 'baby' ? 0.75 : stage === 'child' ? 0.88 : 1;
  return (
    <>
      {([-1, 1] as const).map((s) => (
        <Wag
          key={s}
          position={[s * 0.17, 0.45, -0.05]}
          rotation={[0, 0, -s * 0.14]}
          speed={1.6}
          amount={0.07}
          axis="z"
          motion={motion}
          liveliness={liveliness}
        >
          <group scale={k}>
            <mesh
              geometry={GEO.capsule}
              material={toon(c.body)}
              position={[0, 0.32, 0]}
              scale={[0.1, 0.4, 0.07]}
            />
            <mesh
              geometry={GEO.capsule}
              material={toon(c.pink)}
              position={[0, 0.32, 0.045]}
              scale={[0.05, 0.32, 0.03]}
            />
          </group>
        </Wag>
      ))}
    </>
  );
}

function BunnyFace({ c }: PartProps) {
  return (
    <>
      <mesh
        geometry={GEO.sphereLow}
        material={toon(c.pink)}
        position={onHead(0, -0.1, 0.01)}
        scale={[0.035, 0.025, 0.025]}
      />
      <mesh
        geometry={GEO.capsule}
        material={flat('#ffffff')}
        position={onHead(0, -0.23, -0.005)}
        scale={[0.03, 0.02, 0.02]}
        rotation={[0, 0, Math.PI / 2]}
      />
    </>
  );
}

function BunnyBody({ c }: PartProps) {
  return (
    <mesh
      geometry={GEO.sphere}
      material={toon(c.belly)}
      position={[0, -0.18, -0.36]}
      scale={0.12}
    />
  );
}

function FoxHead({ c, stage }: PartProps) {
  const k = isYoung(stage) ? 0.85 : 1;
  return (
    <>
      {([-1, 1] as const).map((s) => (
        <group key={s} position={[s * 0.3, 0.42, -0.04]} rotation={[0, 0, -s * 0.32]} scale={k}>
          <mesh
            geometry={GEO.cone}
            material={toon(c.body)}
            scale={[0.2, 0.42, 0.13]}
            position={[0, 0.17, 0]}
          />
          <mesh
            geometry={GEO.cone}
            material={toon(c.accent)}
            scale={[0.09, 0.15, 0.07]}
            position={[0, 0.32, 0.01]}
          />
          <mesh
            geometry={GEO.cone}
            material={toon(c.belly)}
            scale={[0.11, 0.22, 0.05]}
            position={[0, 0.1, 0.07]}
          />
        </group>
      ))}
    </>
  );
}

function FoxFace({ c }: PartProps) {
  return (
    <>
      {([-1, 1] as const).map((s) => (
        <mesh
          key={s}
          geometry={GEO.sphere}
          material={toon(c.belly)}
          position={onHead(s * 0.17, -0.17, -0.09)}
          scale={[0.19, 0.13, 0.12]}
        />
      ))}
      <mesh
        geometry={GEO.sphere}
        material={flat(INK)}
        position={onHead(0, -0.08, 0.035)}
        scale={[0.045, 0.035, 0.03]}
      />
    </>
  );
}

function FoxBody({ c, stage, motion, liveliness }: PartProps) {
  const k = stage === 'baby' ? 0.65 : stage === 'child' ? 0.85 : 1;
  return (
    <Wag
      position={[0, -0.22, -0.3]}
      speed={2}
      amount={0.3}
      axis="y"
      motion={motion}
      liveliness={liveliness}
    >
      <group scale={k} rotation={[-0.5, 0, 0]}>
        <mesh
          geometry={GEO.sphere}
          material={toon(c.body)}
          position={[0, 0.08, -0.08]}
          scale={[0.16, 0.16, 0.2]}
        />
        <mesh
          geometry={GEO.sphere}
          material={toon(c.body)}
          position={[0, 0.3, -0.2]}
          scale={[0.19, 0.2, 0.19]}
        />
        <mesh
          geometry={GEO.sphere}
          material={toon(c.belly)}
          position={[0, 0.52, -0.26]}
          scale={[0.14, 0.14, 0.14]}
        />
      </group>
    </Wag>
  );
}

function PandaHead({ c }: PartProps) {
  return (
    <>
      {([-1, 1] as const).map((s) => (
        <mesh
          key={s}
          geometry={GEO.sphere}
          material={toon(c.accent)}
          position={[s * 0.37, 0.4, -0.06]}
          scale={[0.15, 0.15, 0.1]}
        />
      ))}
    </>
  );
}

function PandaFace({ c }: PartProps) {
  return (
    <>
      {([-1, 1] as const).map((s) => (
        <mesh
          key={s}
          geometry={GEO.sphere}
          material={toon(c.accent)}
          position={onHead(s * 0.2, 0.0, -0.035)}
          rotation={[0, s * 0.35, -s * 0.5]}
          scale={[0.12, 0.165, 0.05]}
        />
      ))}
      <mesh
        geometry={GEO.sphere}
        material={flat(INK)}
        position={onHead(0, -0.1, 0.02)}
        scale={[0.05, 0.035, 0.03]}
      />
    </>
  );
}

function PandaBody({ c }: PartProps) {
  return (
    <mesh
      geometry={GEO.sphereLow}
      material={toon(c.body)}
      position={[0, -0.2, -0.35]}
      scale={0.08}
    />
  );
}

function DragonHead({ c, stage }: PartProps) {
  const k = stage === 'baby' ? 0.6 : stage === 'child' ? 0.8 : 1;
  return (
    <>
      {([-1, 1] as const).map((s) => (
        <mesh
          key={s}
          geometry={GEO.cone}
          material={toon(c.belly)}
          position={[s * 0.2, 0.55, -0.1]}
          rotation={[-0.35, 0, -s * 0.25]}
          scale={[0.07 * k, 0.24 * k, 0.07 * k]}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          geometry={GEO.cone}
          material={toon(c.accent)}
          position={[0, 0.5 - i * 0.13, -0.32 - i * 0.12]}
          rotation={[-0.9 - i * 0.35, 0, 0]}
          scale={[0.06, 0.13, 0.04]}
        />
      ))}
    </>
  );
}

function DragonFace({ c }: PartProps) {
  return (
    <>
      <mesh
        geometry={GEO.sphere}
        material={toon(c.body)}
        position={onHead(0, -0.16, -0.08)}
        scale={[0.19, 0.12, 0.12]}
      />
      {([-1, 1] as const).map((s) => (
        <mesh
          key={s}
          geometry={GEO.sphereLow}
          material={flat(c.accent)}
          position={onHead(s * 0.05, -0.11, 0.04)}
          scale={0.015}
        />
      ))}
    </>
  );
}

function DragonBody({ c, stage, motion, liveliness }: PartProps) {
  const tube = getTube(
    'dragon',
    [
      [0, 0, 0],
      [0, -0.1, -0.2],
      [0.12, -0.18, -0.38],
      [0.28, -0.12, -0.48],
    ],
    0.08,
  );
  // Wings grow at the teen stage.
  const wing = stage === 'teen' ? 0.6 : stage === 'adult' || stage === 'senior' ? 1 : 0;
  const tailK = stage === 'baby' ? 0.6 : 1;
  return (
    <>
      <Wag
        position={[0, -0.12, -0.25]}
        speed={1.8}
        amount={0.25}
        axis="y"
        motion={motion}
        liveliness={liveliness}
      >
        <group scale={tailK}>
          <mesh geometry={tube} material={toon(c.body)} />
          <mesh
            geometry={GEO.cone}
            material={toon(c.accent)}
            position={[0.32, -0.11, -0.5]}
            rotation={[0, 0, -Math.PI / 2]}
            scale={[0.07, 0.14, 0.04]}
          />
        </group>
      </Wag>
      {[0, 1].map((i) => (
        <mesh
          key={i}
          geometry={GEO.cone}
          material={toon(c.accent)}
          position={[0, 0.18 - i * 0.18, -0.33 + i * 0.02]}
          rotation={[-1.2, 0, 0]}
          scale={[0.05, 0.12, 0.035]}
        />
      ))}
      {wing > 0 &&
        ([-1, 1] as const).map((s) => (
          <Wag
            key={s}
            position={[s * 0.18, 0.2, -0.24]}
            rotation={[0.15, s * 0.35, s * 0.25]}
            speed={4}
            amount={0.35}
            axis="y"
            motion={motion}
            liveliness={liveliness}
          >
            <mesh
              geometry={getWingGeometry()}
              material={toon(c.accent, true)}
              scale={[s * 0.95 * wing, 0.95 * wing, 1]}
            />
          </Wag>
        ))}
    </>
  );
}

export const MODEL_REGISTRY: Record<Species, SpeciesConfig> = {
  cat: { Head: CatHead, Face: CatFace, Body: CatBody },
  dog: { Head: DogHead, Face: DogFace, Body: DogBody, mouthY: -0.24, mouthLift: 0.0 },
  bunny: { Head: BunnyHead, Face: BunnyFace, Body: BunnyBody },
  fox: { Head: FoxHead, Face: FoxFace, Body: FoxBody, mouthY: -0.2, mouthLift: 0.0 },
  panda: { Head: PandaHead, Face: PandaFace, Body: PandaBody, limbColor: (c) => c.accent },
  dragon: { Head: DragonHead, Face: DragonFace, Body: DragonBody, mouthY: -0.22, mouthLift: 0.0 },
};

// --- Shared chibi body -----------------------------------------------------------

export function PetModel({ species, ...props }: PetModelProps & { species: Species }) {
  const cfg = MODEL_REGISTRY[species];
  const { colors: c, stage, star, face, pose, reaction, equipped, motion, liveliness } = props;
  const headRef = useRef<Group>(null);
  const baby = stage === 'baby';
  const headScale = baby ? 1.06 : 1;
  const bodyScale = baby ? 0.86 : stage === 'adult' || stage === 'senior' ? 1.06 : 1;
  const limb = cfg.limbColor?.(c) ?? c.body;
  const parts: PartProps = { c, stage, motion, liveliness };

  useFrame(() => {
    const h = headRef.current;
    const p = pose.current;
    if (!h || !p) return;
    h.rotation.x += (p.droop * 0.35 - h.rotation.x) * 0.1;
    h.rotation.z += (p.tilt - h.rotation.z) * 0.1;
  });

  return (
    <group>
      {/* Body */}
      <group position={[0, BODY_Y * bodyScale, 0]} scale={bodyScale}>
        <mesh geometry={GEO.sphere} material={toon(c.body)} scale={[0.36, 0.37, 0.33]} />
        <mesh
          geometry={GEO.sphere}
          material={toon(c.belly)}
          position={[0, -0.03, 0.2]}
          scale={[0.24, 0.26, 0.15]}
        />
        {([-1, 1] as const).map((s) => (
          <mesh
            key={`arm${s}`}
            geometry={GEO.capsule}
            material={toon(limb)}
            position={[s * 0.31, 0.05, 0.1]}
            rotation={[0.3, 0, s * 0.7]}
            scale={[0.075, 0.1, 0.075]}
          />
        ))}
        {([-1, 1] as const).map((s) => (
          <mesh
            key={`foot${s}`}
            geometry={GEO.sphere}
            material={toon(limb)}
            position={[s * 0.17, -0.34, 0.1]}
            scale={[0.12, 0.08, 0.15]}
          />
        ))}
        {cfg.Body && <cfg.Body {...parts} />}
      </group>

      {/* Head */}
      <group ref={headRef} position={[0, HEAD_Y * (baby ? 0.92 : 1), 0]} scale={headScale}>
        <mesh
          geometry={GEO.sphere}
          material={toon(c.body)}
          scale={HEAD_SCALE.map((s) => s * HEAD_R) as [number, number, number]}
        />
        <cfg.Head {...parts} />
        {cfg.Face && <cfg.Face {...parts} />}
        <Face
          face={face}
          reaction={reaction}
          blush={c.pink}
          {...(cfg.mouthY !== undefined ? { mouthY: cfg.mouthY } : {})}
          {...(cfg.mouthLift !== undefined ? { mouthLift: cfg.mouthLift } : {})}
        />
        {star && (
          <mesh
            geometry={getStarGeometry()}
            material={flat('#ffd23f')}
            position={onHead(0, 0.3, 0.01)}
            rotation={[-0.5, 0, 0]}
            scale={0.07}
          />
        )}
        <Accessories equipped={equipped} part="head" />
      </group>
      <group position={[0, BODY_Y * bodyScale, 0]} scale={bodyScale}>
        <Accessories equipped={equipped} part="body" />
      </group>
    </group>
  );
}
