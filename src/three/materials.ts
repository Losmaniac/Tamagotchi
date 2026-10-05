import {
  Color,
  DataTexture,
  DoubleSide,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshToonMaterial,
  NearestFilter,
  RedFormat,
  type Material,
} from 'three';

/**
 * Two looks:
 * - 'plush'  (default): soft velvety fur (physical material with sheen), glossy eyes,
 *   lit by a procedural room environment — richer and more lifelike.
 * - 'cartoon' (low-power mode): cel-shaded toon material with a 3-step gradient map.
 */
export type MaterialQuality = 'plush' | 'cartoon';

let quality: MaterialQuality = 'plush';

export function setMaterialQuality(q: MaterialQuality): void {
  quality = q;
}

export function getMaterialQuality(): MaterialQuality {
  return quality;
}

let gradientMap: DataTexture | null = null;

/** 3-step gradient map → crisp cel-shaded bands. */
export function getGradientMap(): DataTexture {
  if (!gradientMap) {
    const data = new Uint8Array([90, 180, 255]);
    gradientMap = new DataTexture(data, data.length, 1, RedFormat);
    gradientMap.minFilter = NearestFilter;
    gradientMap.magFilter = NearestFilter;
    gradientMap.generateMipmaps = false;
    gradientMap.needsUpdate = true;
  }
  return gradientMap;
}

const cache = new Map<string, Material>();
const tmp = new Color();

function cached<T extends Material>(key: string, make: () => T): T {
  let m = cache.get(key) as T | undefined;
  if (!m) {
    m = make();
    cache.set(key, m);
  }
  return m;
}

/**
 * Body material per colour ("toon" kept as the name for the call sites).
 * Plush: velvety sheen with a lighter sheen colour, like soft fur.
 */
export function toon(color: string, doubleSided = false): Material {
  return cached(`${quality}|body|${color}|${doubleSided}`, () => {
    const side = doubleSided ? DoubleSide : undefined;
    if (quality === 'cartoon') {
      const m = new MeshToonMaterial({ color, gradientMap: getGradientMap() });
      if (side) m.side = side;
      return m;
    }
    const sheenColor = tmp.set(color).lerp(new Color('#ffffff'), 0.3).clone();
    const m = new MeshPhysicalMaterial({
      color,
      roughness: 0.82,
      metalness: 0,
      sheen: 0.7,
      sheenRoughness: 0.5,
      sheenColor,
      envMapIntensity: 0.35,
    });
    if (side) m.side = side;
    return m;
  });
}

/** Glossy material for eyes, noses and shells: a wet-looking clearcoat in plush mode. */
export function gloss(color: string): Material {
  return cached(`${quality}|gloss|${color}`, () =>
    quality === 'cartoon'
      ? new MeshBasicMaterial({ color })
      : new MeshPhysicalMaterial({
          color,
          roughness: 0.25,
          clearcoat: 1,
          clearcoatRoughness: 0.08,
          envMapIntensity: 1.1,
        }),
  );
}

/** Unlit material for highlights and other graphic details. */
export function flat(color: string, opacity = 1): Material {
  return cached(
    `flat|${color}|${opacity}`,
    () => new MeshBasicMaterial({ color, transparent: opacity < 1, opacity }),
  );
}

/** Self-lit glowing material (Sparky's antenna bulbs). */
export function glow(color: string): Material {
  return cached(`glow|${color}`, () => new MeshBasicMaterial({ color, toneMapped: false }));
}
