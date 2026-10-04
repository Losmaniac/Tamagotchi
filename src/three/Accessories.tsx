import { Shape, ShapeGeometry } from 'three';
import { getItem, type ItemId } from '../game/shop';
import type { Equipped } from './anim';
import { onHead } from './Face';
import { GEO } from './geometry';
import { flat, toon } from './materials';

let heartGeometry: ShapeGeometry | null = null;
function getHeartGeometry() {
  if (!heartGeometry) {
    const s = new Shape();
    s.moveTo(0, -0.9);
    s.bezierCurveTo(-1.4, 0, -0.8, 1.1, 0, 0.45);
    s.bezierCurveTo(0.8, 1.1, 1.4, 0, 0, -0.9);
    heartGeometry = new ShapeGeometry(s, 12);
  }
  return heartGeometry;
}

function Hat({ id }: { id: ItemId }) {
  const item = getItem(id);
  if (!item) return null;
  const color = item.color;
  const accent = item.accent ?? '#ffffff';
  switch (id) {
    case 'partyHat':
      return (
        <group position={[0.1, 0.62, 0]} rotation={[0, 0, -0.25]}>
          <mesh geometry={GEO.cone} material={toon(color)} scale={[0.17, 0.38, 0.17]} />
          <mesh
            geometry={GEO.ring}
            material={toon(accent)}
            position={[0, -0.12, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[0.14, 0.14, 0.12]}
          />
          <mesh
            geometry={GEO.sphereLow}
            material={toon(accent)}
            position={[0, 0.21, 0]}
            scale={0.06}
          />
        </group>
      );
    case 'beanie':
      return (
        <group position={[0, 0.3, -0.02]}>
          <mesh
            geometry={GEO.sphere}
            material={toon(color)}
            scale={[0.56, 0.36, 0.52]}
            position={[0, 0.06, 0]}
          />
          <mesh
            geometry={GEO.ring}
            material={toon(accent)}
            rotation={[Math.PI / 2, 0, 0]}
            position={[0, 0.02, 0]}
            scale={[0.55, 0.51, 0.35]}
          />
          <mesh
            geometry={GEO.sphereLow}
            material={toon(accent)}
            position={[0, 0.44, 0]}
            scale={0.09}
          />
        </group>
      );
    case 'flowerCrown':
      return (
        <group position={[0, 0.4, -0.02]} rotation={[-0.15, 0, 0]}>
          <mesh
            geometry={GEO.ring}
            material={toon(color)}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[0.4, 0.37, 0.15]}
          />
          {Array.from({ length: 7 }, (_, i) => {
            const a = (i / 7) * Math.PI * 2;
            return (
              <mesh
                key={i}
                geometry={GEO.sphereLow}
                material={toon(i % 2 ? accent : '#ffd23f')}
                position={[Math.cos(a) * 0.4, 0.03, Math.sin(a) * 0.37]}
                scale={0.06}
              />
            );
          })}
        </group>
      );
    case 'crown':
      return (
        <group position={[0, 0.58, -0.02]}>
          <mesh geometry={GEO.cylinder} material={toon(color)} scale={[0.2, 0.12, 0.2]} />
          {Array.from({ length: 5 }, (_, i) => {
            const a = (i / 5) * Math.PI * 2;
            return (
              <mesh
                key={i}
                geometry={GEO.cone}
                material={toon(color)}
                position={[Math.cos(a) * 0.17, 0.1, Math.sin(a) * 0.17]}
                scale={[0.05, 0.1, 0.05]}
              />
            );
          })}
          <mesh
            geometry={GEO.sphereLow}
            material={toon(accent)}
            position={[0, 0, 0.2]}
            scale={0.04}
          />
        </group>
      );
    default:
      return null;
  }
}

function Glasses({ id }: { id: ItemId }) {
  const item = getItem(id);
  if (!item) return null;
  const mat = flat(item.color);
  const bridge = (
    <mesh
      geometry={GEO.capsule}
      material={mat}
      position={onHead(0, 0.04, 0.05)}
      rotation={[0, 0, Math.PI / 2]}
      scale={[0.012, 0.08, 0.012]}
    />
  );
  return (
    <group>
      {([-1, 1] as const).map((s) => {
        const pos = onHead(s * 0.2, 0.02, 0.05);
        const rot: [number, number, number] = [0, s * 0.35, 0];
        if (id === 'roundGlasses')
          return (
            <mesh
              key={s}
              geometry={GEO.ring}
              material={mat}
              position={pos}
              rotation={rot}
              scale={[0.11, 0.11, 0.06]}
            />
          );
        if (id === 'sunglasses')
          return (
            <mesh
              key={s}
              geometry={GEO.sphere}
              material={flat(item.color)}
              position={pos}
              rotation={rot}
              scale={[0.13, 0.1, 0.03]}
            />
          );
        return (
          <mesh
            key={s}
            geometry={getHeartGeometry()}
            material={flat(item.color, 0.92)}
            position={pos}
            rotation={rot}
            scale={0.12}
          />
        );
      })}
      {bridge}
    </group>
  );
}

function Neckwear({ id }: { id: ItemId }) {
  const item = getItem(id);
  if (!item) return null;
  const color = item.color;
  if (id === 'bowtie')
    return (
      <group position={[0, 0.3, 0.29]}>
        {([-1, 1] as const).map((s) => (
          <mesh
            key={s}
            geometry={GEO.cone}
            material={toon(color)}
            position={[s * 0.08, 0, 0]}
            rotation={[0, 0, (s * Math.PI) / 2]}
            scale={[0.06, 0.12, 0.04]}
          />
        ))}
        <mesh geometry={GEO.sphereLow} material={toon(color)} scale={0.04} />
      </group>
    );
  const accent = item.accent ?? color;
  return (
    <group position={[0, 0.3, 0]}>
      <mesh
        geometry={GEO.ring}
        material={toon(color)}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.29, 0.27, 0.3]}
      />
      {id === 'stripedScarf' && (
        <mesh
          geometry={GEO.ring}
          material={toon(accent)}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, -0.05, 0]}
          scale={[0.3, 0.28, 0.2]}
        />
      )}
      <mesh
        geometry={GEO.capsule}
        material={toon(color)}
        position={[0.14, -0.14, 0.24]}
        rotation={[0.2, 0, 0.25]}
        scale={[0.06, 0.1, 0.03]}
      />
    </group>
  );
}

/** Cosmetic accessories; `part` picks head-local or body-local items. */
export function Accessories({ equipped, part }: { equipped: Equipped; part: 'head' | 'body' }) {
  if (part === 'head')
    return (
      <>
        {equipped.hat && <Hat id={equipped.hat} />}
        {equipped.glasses && <Glasses id={equipped.glasses} />}
      </>
    );
  return equipped.scarf ? <Neckwear id={equipped.scarf} /> : null;
}
