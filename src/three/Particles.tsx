import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { SpriteMaterial, type Sprite } from 'three';
import { spriteTexture, type SpriteKind } from './sprites';

const MAX = 48;

interface Particle {
  active: boolean;
  kind: SpriteKind;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  age: number;
  life: number;
  size: number;
  gravity: number;
  sway: number;
}

export interface EmitOptions {
  origin?: [number, number, number];
  spread?: number;
  up?: number;
  life?: number;
  size?: number;
  gravity?: number;
  sway?: number;
}

/** Pool-based sprite particles: hearts, sparkles, bubbles, crumbs, Zzz, stink lines. */
export class ParticleSystem {
  readonly pool: Particle[] = Array.from({ length: MAX }, () => ({
    active: false,
    kind: 'heart' as SpriteKind,
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    age: 0,
    life: 1,
    size: 0.2,
    gravity: 0,
    sway: 0,
  }));
  /** 0 disables particles (low-power), <1 thins them out (reduced motion). */
  density = 1;

  emit(kind: SpriteKind, count: number, o: EmitOptions = {}): void {
    const n = Math.round(count * this.density);
    const [ox, oy, oz] = o.origin ?? [0, 1.2, 0.3];
    const spread = o.spread ?? 0.5;
    for (let i = 0; i < n; i++) {
      const p = this.pool.find((q) => !q.active);
      if (!p) return;
      p.active = true;
      p.kind = kind;
      p.x = ox + (Math.random() - 0.5) * spread;
      p.y = oy + (Math.random() - 0.5) * spread * 0.4;
      p.z = oz + (Math.random() - 0.5) * spread * 0.3;
      p.vx = (Math.random() - 0.5) * spread * 1.2;
      p.vy = (o.up ?? 0.8) * (0.7 + Math.random() * 0.6);
      p.vz = (Math.random() - 0.5) * 0.2;
      p.age = 0;
      p.life = (o.life ?? 1.2) * (0.8 + Math.random() * 0.4);
      p.size = (o.size ?? 0.2) * (0.8 + Math.random() * 0.4);
      p.gravity = o.gravity ?? 0;
      p.sway = o.sway ?? 0;
    }
  }

  setDensity(density: number): void {
    this.density = density;
    if (density === 0) this.clear();
  }

  clear(): void {
    for (const p of this.pool) p.active = false;
  }
}

export function ParticleLayer({ system }: { system: ParticleSystem }) {
  const refs = useRef<(Sprite | null)[]>([]);
  const materials = useMemo(
    () =>
      Array.from(
        { length: MAX },
        () =>
          new SpriteMaterial({ map: spriteTexture('heart'), transparent: true, depthWrite: false }),
      ),
    [],
  );

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    system.pool.forEach((p, i) => {
      const s = refs.current[i];
      if (!s) return;
      if (!p.active) {
        s.visible = false;
        return;
      }
      p.age += delta;
      if (p.age >= p.life) {
        p.active = false;
        s.visible = false;
        return;
      }
      p.vy -= p.gravity * delta;
      p.x += (p.vx + Math.sin(p.age * 6) * p.sway) * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;
      const mat = materials[i]!;
      const tex = spriteTexture(p.kind);
      if (mat.map !== tex) mat.map = tex;
      const k = p.age / p.life;
      mat.opacity = k < 0.15 ? k / 0.15 : 1 - Math.max(0, (k - 0.6) / 0.4);
      const pop = Math.min(1, p.age * 8);
      s.visible = true;
      s.position.set(p.x, p.y, p.z);
      s.scale.setScalar(p.size * pop);
    });
  });

  return (
    <group>
      {materials.map((m, i) => (
        <sprite
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          material={m}
          visible={false}
          renderOrder={10}
        />
      ))}
    </group>
  );
}

/** A particle system for one canvas; density follows low-power / reduced-motion settings. */
export function useParticleSystem(density: number): ParticleSystem {
  const system = useMemo(() => new ParticleSystem(), []);
  useEffect(() => system.setDensity(density), [system, density]);
  return system;
}
