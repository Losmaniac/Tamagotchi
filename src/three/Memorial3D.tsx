import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { GEO } from './geometry';
import { flat, toon } from './materials';

/** Gentle death scene: a little ghost floats up from a flower-decked tombstone. */
export function Memorial3D({ motion }: { motion: number }) {
  const ghost = useRef<Group>(null);
  useFrame(({ clock }) => {
    const g = ghost.current;
    if (!g) return;
    const t = clock.elapsedTime;
    const rise = motion > 0.5 ? (t * 0.25) % 2.2 : 0.6;
    g.position.y = 1.0 + rise + Math.sin(t * 2) * 0.05;
    g.position.x = 0.45 + Math.sin(t * 1.3) * 0.12 * motion;
    const fade = motion > 0.5 ? Math.max(0, 1 - Math.max(0, rise - 1.4) / 0.8) : 1;
    g.scale.setScalar(0.9 * fade + 0.0001);
  });
  const ghostMat = flat('#ffffff', 0.85);
  return (
    <group>
      {/* tombstone */}
      <group position={[-0.25, 0, 0]}>
        <mesh
          geometry={GEO.capsule}
          material={toon('#b9b3c9')}
          position={[0, 0.55, 0]}
          scale={[0.42, 0.4, 0.14]}
        />
        <mesh
          geometry={GEO.cylinder}
          material={toon('#9d96b0')}
          position={[0, 0.1, 0]}
          scale={[0.5, 0.2, 0.22]}
        />
        <mesh
          geometry={GEO.capsule}
          material={flat('#7a7390')}
          position={[0, 0.72, 0.14]}
          scale={[0.02, 0.12, 0.02]}
        />
        <mesh
          geometry={GEO.capsule}
          material={flat('#7a7390')}
          position={[0, 0.76, 0.14]}
          rotation={[0, 0, Math.PI / 2]}
          scale={[0.02, 0.07, 0.02]}
        />
        {[-0.3, -0.1, 0.15, 0.32].map((x, i) => (
          <group key={i} position={[x, 0.2, 0.25]}>
            <mesh
              geometry={GEO.cylinder}
              material={toon('#3ddc97')}
              position={[0, -0.05, 0]}
              scale={[0.012, 0.15, 0.012]}
            />
            <mesh
              geometry={GEO.sphereLow}
              material={toon(['#ff8fc7', '#ffd23f', '#a78bfa', '#ff8fc7'][i]!)}
              position={[0, 0.05, 0]}
              scale={0.05}
            />
          </group>
        ))}
      </group>
      {/* ghost */}
      <group ref={ghost} position={[0.45, 1.2, 0.2]}>
        <mesh geometry={GEO.sphere} material={ghostMat} scale={[0.3, 0.32, 0.28]} />
        <mesh
          geometry={GEO.cone}
          material={ghostMat}
          position={[0, -0.3, 0]}
          rotation={[Math.PI, 0, 0]}
          scale={[0.3, 0.35, 0.28]}
        />
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            geometry={GEO.arc}
            material={flat('#2b1a3d')}
            position={[s * 0.1, 0.03, 0.27]}
            rotation={[0, 0, Math.PI]}
            scale={[0.04, 0.035, 0.03]}
          />
        ))}
        <mesh
          geometry={GEO.ring}
          material={flat('#ffd23f')}
          position={[0, 0.4, 0]}
          rotation={[Math.PI / 2.3, 0, 0]}
          scale={[0.16, 0.16, 0.1]}
        />
      </group>
    </group>
  );
}
