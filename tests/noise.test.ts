import { describe, it, expect } from 'vitest';
import { hash2, noise2, fbm, terrainHeight, rand01 } from '@shared/noise';
import { HEIGHT } from '@shared/config';

describe('noise', () => {
  it('hash2 cho kết quả ổn định (deterministic)', () => {
    expect(hash2(10, 20)).toBe(hash2(10, 20));
    expect(hash2(-5, 7)).toBe(hash2(-5, 7));
  });
  it('hash2 nằm trong [0, 1)', () => {
    for (let i = -50; i < 50; i++) {
      const v = hash2(i * 13, i * 7);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it('noise2 nội suy mượt trong [0, 1]', () => {
    for (let i = 0; i < 100; i++) {
      const v = noise2(i * 0.37, i * 0.61);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
  it('fbm nằm trong [0, 1]', () => {
    for (let i = 0; i < 50; i++) {
      const v = fbm(i * 1.3, i * 2.7);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
  it('terrainHeight luôn trong giới hạn thế giới', () => {
    for (let x = -200; x <= 200; x += 17) for (let z = -200; z <= 200; z += 23) {
      const h = terrainHeight(x, z);
      expect(h).toBeGreaterThanOrEqual(2);
      expect(h).toBeLessThan(HEIGHT);
      expect(Number.isInteger(h)).toBe(true);
    }
  });
  it('rand01 deterministic và trong [0, 1)', () => {
    expect(rand01(42)).toBe(rand01(42));
    expect(rand01(42)).toBeGreaterThanOrEqual(0);
    expect(rand01(42)).toBeLessThan(1);
  });
});
