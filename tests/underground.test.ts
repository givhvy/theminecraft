import { describe, it, expect } from 'vitest';
import { WorldMap, LAVA_LEVEL } from '@shared/world';
import { AIR, LAVA, DIAMOND, B } from '@shared/blocks';
import { CHUNK } from '@shared/config';
import { terrainHeight } from '@shared/noise';

// quét một vùng chunk và đếm block theo loại dưới lòng đất
function scan(radius: number) {
  const w = new WorldMap();
  let caves = 0, lava = 0, diamonds = 0;
  for (let cx = -radius; cx <= radius; cx++) for (let cz = -radius; cz <= radius; cz++) {
    const c = w.getChunk(cx, cz);
    for (let x = 0; x < CHUNK; x++) for (let z = 0; z < CHUNK; z++) {
      const h = terrainHeight(cx * CHUNK + x, cz * CHUNK + z);
      for (let y = 1; y < h - 3; y++) {
        const b = c.data[(y * CHUNK + z) * CHUNK + x];
        if (b === AIR) caves++;
        else if (b === LAVA) lava++;
        else if (b === DIAMOND) diamonds++;
      }
    }
  }
  return { caves, lava, diamonds };
}

describe('lòng đất: hang động, dung nham, kim cương', () => {
  const r = scan(3); // 7×7 chunk quanh spawn

  it('có hang động (air dưới mặt đất)', () => {
    expect(r.caves).toBeGreaterThan(100);
  });
  it('có dung nham trong hang sâu', () => {
    expect(r.lava).toBeGreaterThan(20);
  });
  it('có quặng kim cương gần đáy', () => {
    expect(r.diamonds).toBeGreaterThan(3);
  });
  it('dung nham chỉ từ LAVA_LEVEL trở xuống', () => {
    const w = new WorldMap();
    for (let cx = -2; cx <= 2; cx++) for (let cz = -2; cz <= 2; cz++) {
      const c = w.getChunk(cx, cz);
      for (let x = 0; x < CHUNK; x++) for (let z = 0; z < CHUNK; z++) {
        for (let y = LAVA_LEVEL + 1; y < 60; y++) {
          expect(c.data[(y * CHUNK + z) * CHUNK + x]).not.toBe(LAVA);
        }
      }
    }
  });
  it('LAVA là chất lỏng phát sáng gây sát thương', () => {
    expect(B[LAVA].liquid).toBe(true);
    expect(B[LAVA].emissive).toBe(true);
    expect(B[LAVA].damage).toBeGreaterThan(0);
  });
});
