import {
  DataTexture,
  DoubleSide,
  MeshBasicMaterial,
  MeshToonMaterial,
  NearestFilter,
  RedFormat,
  type Material,
} from 'three';

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

const toonCache = new Map<string, MeshToonMaterial>();
const flatCache = new Map<string, Material>();

/** Shared toon material per color (materials are cached, never disposed). */
export function toon(color: string, doubleSided = false): MeshToonMaterial {
  const key = `${color}|${doubleSided}`;
  let m = toonCache.get(key);
  if (!m) {
    m = new MeshToonMaterial({ color, gradientMap: getGradientMap() });
    if (doubleSided) m.side = DoubleSide;
    toonCache.set(key, m);
  }
  return m;
}

/** Unlit material for eyes, highlights and other graphic details. */
export function flat(color: string, opacity = 1): Material {
  const key = `${color}|${opacity}`;
  let m = flatCache.get(key);
  if (!m) {
    m = new MeshBasicMaterial({ color, transparent: opacity < 1, opacity });
    flatCache.set(key, m);
  }
  return m;
}
