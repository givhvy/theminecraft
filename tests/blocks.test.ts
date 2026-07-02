import { describe, it, expect } from 'vitest';
import { B, TOOLS, isValidBlockId, toolIsFast, AIR } from '@shared/blocks';

const NTILES = 52; // phải khớp với client/src/textures.ts

describe('blocks', () => {
  it('mọi tile index nằm trong atlas', () => {
    for (const id in B) {
      const t = B[Number(id)].tiles;
      for (const idx of [t.top, t.bottom, t.side]) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(NTILES);
      }
    }
  });
  it('mọi block có tên VI + EN và độ cứng hợp lệ', () => {
    for (const id in B) {
      const def = B[Number(id)];
      expect(def.name.length).toBeGreaterThan(0);
      expect(def.nameEn.length).toBeGreaterThan(0);
      expect(def.hardness).toBeGreaterThanOrEqual(0);
    }
  });
  it('isValidBlockId đúng với AIR, block thật và id rác', () => {
    expect(isValidBlockId(AIR)).toBe(true);
    expect(isValidBlockId(1)).toBe(true);
    expect(isValidBlockId(999)).toBe(false);
    expect(isValidBlockId(-1)).toBe(false);
  });
  it('có đủ nội thất (>= 14 block id mới từ 25 trở lên)', () => {
    const furniture = Object.keys(B).map(Number).filter(id => id >= 25);
    expect(furniture.length).toBeGreaterThanOrEqual(14);
  });
  it('block portal và netherrack hợp lệ', () => {
    expect(isValidBlockId(40)).toBe(true);
    expect(isValidBlockId(41)).toBe(true);
    expect(B[41].portal).toBe(true);
  });
  it('toolIsFast: cúp nhanh với đá và kim loại, rìu với gỗ', () => {
    expect(toolIsFast(TOOLS.pickaxe, 'stone')).toBe(true);
    expect(toolIsFast(TOOLS.pickaxe, 'metal')).toBe(true);
    expect(toolIsFast(TOOLS.pickaxe, 'wood')).toBe(false);
    expect(toolIsFast(TOOLS.axe, 'wood')).toBe(true);
    expect(toolIsFast(TOOLS.sword, 'cloth')).toBe(true);
  });
});
