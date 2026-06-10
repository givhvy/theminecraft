import { SEED, HEIGHT } from './config.js';

export function rand01(seed: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}
export function hash2(x: number, z: number): number {
  let h = (x * 374761393 + z * 668265263 + SEED * 144665) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

export function noise2(x: number, z: number): number {
  const xi = Math.floor(x), zi = Math.floor(z);
  const xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  return lerp(lerp(hash2(xi, zi), hash2(xi + 1, zi), u), lerp(hash2(xi, zi + 1), hash2(xi + 1, zi + 1), u), v);
}
export function fbm(x: number, z: number): number {
  let sum = 0, amp = 1, freq = 1, tot = 0;
  for (let i = 0; i < 4; i++) { sum += noise2(x * freq, z * freq) * amp; tot += amp; amp *= 0.5; freq *= 2; }
  return sum / tot;
}
export function terrainHeight(wx: number, wz: number): number {
  const base = fbm(wx * 0.012, wz * 0.012);
  const detail = fbm(wx * 0.06 + 100, wz * 0.06 + 100);
  const h = 9 + base * base * 46 + detail * 5;
  return Math.max(2, Math.min(HEIGHT - 14, h | 0));
}
