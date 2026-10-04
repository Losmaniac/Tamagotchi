import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshToonMaterial, type Group } from 'three';
import { GEO } from './geometry';
import { flat, getGradientMap, toon } from './materials';

/** Gentle death scene: a little ghost floats up from a flower-decked tombstone. */
export function Memorial3D({ motion }: { motion: number }) {
  const ghost = useRef<Group>(null);
  useFrame(({ clock }) => {
    const g = ghost.current;
    if (!g) return;
    const t = clock.elapsedTime;
    const rise = motion > 0.5 ? (t * 0.22) % 1.6 : 0.5;
    g.position.y = 0.75 + rise + Math.sin(t * 2) * 0.05;
    g.position.x = 0.45 + Math.sin(t * 1.3) * 0.1 * motion;
    const fadeIn = Math.min(1, rise / 0.25);
    const fadeOut = Math.max(0, 1 - Math.max(0, rise - 1.1) / 0.5);
    g.scale.setScalar((motion > 0.5 ? Math.min(fadeIn, fadeOut) : 1) * 0.85 + 0.0001);
  });
  const ghostMat = useMemo(
    () =>
      new MeshToonMaterial({
        color: '#f3efff',
        gradientMap: getGradientMap(),
        transparent: true,
        opacity: 0.92,
      }),
    [],
  );
  return (
    <group>
      {/* tombstone */}
      <group position={[-0.22, 0, 0]}>
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
        {/* paw print */}
        <mesh
          geometry={GEO.sphereLow}
          material={flat('#857d9c')}
          position={[0, 0.6, 0.14]}
          scale={[0.085, 0.07, 0.02]}
        />
        {[-0.095, -0.035, 0.035, 0.095].map((x, i) => (
          <mesh
            key={i}
            geometry={GEO.sphereLow}
            material={flat('#857d9c')}
            position={[x, i === 1 || i === 2 ? 0.76 : 0.71, 0.14]}
            scale={[0.03, 0.038, 0.02]}
          />
        ))}
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
      <group ref={ghost} position={[0.55, 1.2, 0.2]}>
        <mesh geometry={GEO.sphere} material={ghostMat} scale={[0.26, 0.3, 0.24]} />
        <mesh
          geometry={GEO.cylinder}
          material={ghostMat}
          position={[0, -0.14, 0]}
          scale={[0.26, 0.28, 0.24]}
        />
        {[-0.17, 0, 0.17].map((x) => (
          <mesh
            key={x}
            geometry={GEO.sphereLow}
            material={ghostMat}
            position={[x, -0.29, 0]}
            scale={[0.09, 0.07, 0.09]}
          />
        ))}
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            geometry={GEO.arc}
            material={flat('#2b1a3d')}
            position={[s * 0.09, 0.03, 0.235]}
            rotation={[0, 0, Math.PI]}
            scale={[0.04, 0.035, 0.03]}
          />
        ))}
        {[-1, 1].map((s) => (
          <mesh
            key={`b${s}`}
            geometry={GEO.sphereLow}
            material={flat('#ffb3d1', 0.8)}
            position={[s * 0.15, -0.04, 0.2]}
            scale={[0.04, 0.025, 0.02]}
          />
        ))}
        <mesh
          geometry={GEO.ring}
          material={flat('#ffd23f')}
          position={[0, 0.38, 0]}
          rotation={[Math.PI / 2.3, 0, 0]}
          scale={[0.14, 0.14, 0.1]}
        />
      </group>
    </group>
  );
}
