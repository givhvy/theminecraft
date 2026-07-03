import { describe, it, expect } from 'vitest';
import { featureForRegion, featuresNear } from '@shared/features';
import { isValidBlockId } from '@shared/blocks';

describe('features (làng / lâu đài / công viên mini)', () => {
  it('deterministic — cùng vùng luôn cho cùng công trình', () => {
    const a = featureForRegion(5, 7);
    const b = featureForRegion(5, 7);
    expect(a).toBe(b); // cache
    if (a) expect(a.placements.length).toBeGreaterThan(0);
  });

  it('vùng spawn (|r| <= 1) không sinh công trình chồng lên công viên chính', () => {
    for (let rx = -1; rx <= 1; rx++) for (let rz = -1; rz <= 1; rz++) {
      expect(featureForRegion(rx, rz)).toBeNull();
    }
  });

  it('trong bán kính 6 vùng có ít nhất vài công trình (xuất hiện nhiều)', () => {
    const found = featuresNear(0, 0, 6);
    expect(found.length).toBeGreaterThanOrEqual(3);
    // có đủ loại trong bán kính rộng
    const kinds = new Set(featuresNear(0, 0, 12).map(f => f.kind));
    expect(kinds.size).toBeGreaterThanOrEqual(2);
  });

  it('mọi block id trong công trình đều hợp lệ', () => {
    for (const f of featuresNear(0, 0, 8)) {
      for (const [, y, , id] of f.placements) {
        expect(isValidBlockId(id)).toBe(true);
        expect(y).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('làng có giường và nội thất', () => {
    const village = featuresNear(0, 0, 20).find(f => f.kind === 'village');
    expect(village).toBeDefined();
    const ids = new Set(village!.placements.map(p => p[3]));
    expect(ids.has(28)).toBe(true); // giường
    expect(ids.has(26)).toBe(true); // bàn
  });
});
