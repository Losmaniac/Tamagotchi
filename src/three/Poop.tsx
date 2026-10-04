import { GEO } from './geometry';
import { flat, toon } from './materials';

const SLOTS: [number, number][] = [
  [0.62, 0.25],
  [-0.62, 0.2],
  [0.45, 0.6],
  [-0.45, 0.6],
  [0.78, -0.15],
  [-0.78, -0.2],
];

/** Cute swirl poops placed around the pet. */
export function Poops({ count }: { count: number }) {
  const brown = toon('#8a5a3b');
  return (
    <>
      {SLOTS.slice(0, count).map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} scale={0.7}>
          <mesh
            geometry={GEO.sphere}
            material={brown}
            position={[0, 0.07, 0]}
            scale={[0.16, 0.08, 0.16]}
          />
          <mesh
            geometry={GEO.sphere}
            material={brown}
            position={[0, 0.16, 0]}
            scale={[0.11, 0.07, 0.11]}
          />
          <mesh
            geometry={GEO.cone}
            material={brown}
            position={[0, 0.25, 0]}
            scale={[0.07, 0.1, 0.07]}
          />
          {[-1, 1].map((s) => (
            <mesh
              key={s}
              geometry={GEO.sphereLow}
              material={flat('#ffffff')}
              position={[s * 0.04, 0.17, 0.09]}
              scale={0.022}
            />
          ))}
        </group>
      ))}
    </>
  );
}

export const POOP_SLOTS = SLOTS;
