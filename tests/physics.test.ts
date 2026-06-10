import { describe, it, expect } from 'vitest';
import { boxCollides, moveEntity, waterSurfaceY, type EntityLike } from '@shared/physics';
import { world } from '@shared/world';
import { STONE, AIR, WATER } from '@shared/blocks';

function makeEntity(x: number, y: number, z: number): EntityLike {
  return { pos: { x, y, z }, vel: { x: 0, y: 0, z: 0 }, halfW: 0.3, height: 1.8, onGround: false };
}

describe('physics', () => {
  it('boxCollides phát hiện block đặc', () => {
    world.setBlock(100, 40, 100, STONE);
    expect(boxCollides(100.5, 40, 100.5, 0.3, 1.8)).toBe(true);
    expect(boxCollides(100.5, 45, 100.5, 0.3, 1.8)).toBe(false);
  });
  it('dưới đáy thế giới coi như đặc (không rơi xuyên)', () => {
    expect(boxCollides(0.5, -5, 0.5, 0.3, 1.8)).toBe(true);
  });
  it('moveEntity dừng lại khi rơi xuống nền và set onGround', () => {
    // tạo nền phẳng
    for (let x = 199; x <= 201; x++) for (let z = 199; z <= 201; z++) {
      world.setBlock(x, 50, z, STONE);
      for (let y = 51; y <= 55; y++) world.setBlock(x, y, z, AIR);
    }
    const e = makeEntity(200.5, 53, 200.5);
    // mô phỏng vòng lặp game: trọng lực kéo xuống mỗi frame
    for (let i = 0; i < 30; i++) {
      e.vel.y -= 26 * 0.05;
      moveEntity(e, 0.05);
    }
    expect(e.onGround).toBe(true);
    expect(e.pos.y).toBeGreaterThanOrEqual(51);
    expect(e.pos.y).toBeLessThan(52);
  });
  it('moveEntity chặn di chuyển ngang vào tường', () => {
    for (let y = 51; y <= 53; y++) world.setBlock(205, y, 200, STONE);
    for (let y = 51; y <= 55; y++) { world.setBlock(204, y, 200, AIR); }
    world.setBlock(204, 50, 200, STONE);
    const e = makeEntity(204.5, 51, 200.5);
    e.vel.x = 10;
    const res = moveEntity(e, 0.1);
    expect(res.hitX).toBe(true);
    expect(e.pos.x).toBeLessThan(204.7);
  });
  it('waterSurfaceY tìm được mặt nước', () => {
    world.setBlock(300, 30, 300, WATER, false);
    expect(waterSurfaceY(300.5, 30, 300.5)).toBe(30);
  });
});
