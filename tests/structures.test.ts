import { describe, it, expect } from 'vitest';
import { STRUCTURES } from '@shared/structures';
import { isValidBlockId, AIR } from '@shared/blocks';
import { findPortalFrameAt } from '@shared/portal';

describe('STRUCTURES (AI Builder)', () => {
  it('có đủ 10 công trình, id không trùng', () => {
    expect(STRUCTURES.length).toBe(10);
    const ids = STRUCTURES.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const s of STRUCTURES) {
    describe(s.name, () => {
      const blocks = s.gen();
      it('sinh ra block (không rỗng)', () => {
        // portal là công trình nhỏ gọn có chủ đích
        expect(blocks.length).toBeGreaterThan(s.id === 'portal' ? 30 : 50);
      });
      it('mọi block id đều hợp lệ', () => {
        for (const [, , , id] of blocks) expect(isValidBlockId(id)).toBe(true);
      });
      it('kích thước hợp lý (không vượt 80 block mỗi chiều)', () => {
        for (const [x, y, z] of blocks) {
          expect(Math.abs(x)).toBeLessThan(80);
          expect(y).toBeGreaterThan(-20);
          expect(y).toBeLessThan(80);
          expect(Math.abs(z)).toBeLessThan(80);
        }
      });
      it('có block đặc ở tầng nền (y=0) để đặt móng', () => {
        expect(blocks.some(([, y, , id]) => y === 0 && id !== AIR)).toBe(true);
      });
    });
  }

  it('cổng nether dựng sẵn tạo khung hợp lệ (kích hoạt được bằng Lửa mồi)', () => {
    const portal = STRUCTURES.find(s => s.id === 'portal')!;
    const placed = new Map<string, number>();
    for (const [x, y, z, id] of portal.gen()) placed.set(`${x},${y},${z}`, id);
    const get = (x: number, y: number, z: number) => placed.get(`${x},${y},${z}`) ?? AIR;
    // click vào block khung dưới cùng
    expect(findPortalFrameAt(0, 1, 2, get)).not.toBeNull();
  });

  it('nhà hiện đại có nội thất', () => {
    const modern = STRUCTURES.find(s => s.id === 'modern')!;
    const ids = new Set(modern.gen().map(b => b[3]));
    // sofa(29), TV(32), giường(28), tủ lạnh(30), bếp(31), thảm(34), đèn(33)
    for (const id of [29, 32, 28, 30, 31, 34, 33]) expect(ids.has(id)).toBe(true);
  });
});
