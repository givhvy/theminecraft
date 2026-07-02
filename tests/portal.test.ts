import { describe, it, expect } from 'vitest';
import { findPortalFrameAt, activatePortal, isInsidePortal } from '@shared/portal';
import { OBSIDIAN, PORTAL, AIR } from '@shared/blocks';

describe('Portal', () => {
  it('phát hiện khung obsidian 4x5', () => {
    const blocks = new Map<string, number>();
    const key = (x: number, y: number, z: number) => `${x},${y},${z}`;
    const get = (x: number, y: number, z: number) => blocks.get(key(x, y, z)) ?? AIR;
    const set = (x: number, y: number, z: number, id: number) => blocks.set(key(x, y, z), id);

    // khung 4x5 tại x=10, y=5, z=20 (axis z)
    for (let h = 0; h < 5; h++) for (let w = 0; w < 4; w++) {
      const isBorder = h === 0 || h === 4 || w === 0 || w === 3;
      set(10, 5 + h, 20 + w, isBorder ? OBSIDIAN : AIR);
    }
    const frame = findPortalFrameAt(10, 6, 21, get);
    expect(frame).not.toBeNull();
    if (frame) {
      activatePortal(frame, set);
      expect(get(10, 6, 21)).toBe(PORTAL);
      expect(isInsidePortal(10.5, 6.5, 21.5, get)).toBe(true);
    }
  });
});
