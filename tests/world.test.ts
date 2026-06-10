import { describe, it, expect, beforeEach } from 'vitest';
import { WorldMap } from '@shared/world';
import { AIR, BEDROCK, WATER, STONE, PLANKS } from '@shared/blocks';
import { HEIGHT, SEA_LEVEL, CHUNK } from '@shared/config';
import { terrainHeight } from '@shared/noise';

let world: WorldMap;
beforeEach(() => { world = new WorldMap(); });

describe('WorldMap', () => {
  it('sinh chunk có bedrock ở đáy', () => {
    for (let x = 0; x < 16; x += 5) for (let z = 0; z < 16; z += 5) {
      expect(world.getBlock(x, 0, z)).toBe(BEDROCK);
    }
  });
  it('bề mặt khớp với terrainHeight', () => {
    const h = terrainHeight(8, 8);
    expect(world.getBlock(8, h, 8)).not.toBe(AIR);
    expect([AIR, WATER]).toContain(world.getBlock(8, h + 1, 8));
  });
  it('vùng trũng được lấp nước tới mực nước biển', () => {
    // tìm một cột thấp hơn mực nước biển
    outer:
    for (let x = -100; x < 100; x += 3) for (let z = -100; z < 100; z += 3) {
      if (terrainHeight(x, z) < SEA_LEVEL) {
        expect(world.getBlock(x, SEA_LEVEL, z)).toBe(WATER);
        break outer;
      }
    }
  });
  it('setBlock + getBlock hoạt động', () => {
    world.setBlock(5, 30, 5, STONE);
    expect(world.getBlock(5, 30, 5)).toBe(STONE);
  });
  it('setBlock ghi lại edit theo chunk để lưu', () => {
    world.setBlock(20, 30, -3, PLANKS);
    const cx = Math.floor(20 / CHUNK), cz = Math.floor(-3 / CHUNK);
    const edits = world.editsByChunk[cx + ',' + cz];
    expect(edits).toBeDefined();
    expect(edits[`${20 - cx * CHUNK},30,${-3 - cz * CHUNK}`]).toBe(PLANKS);
    expect(world.pendingSave).toBe(true);
  });
  it('edit được áp dụng lại khi chunk sinh mới', () => {
    const w2 = new WorldMap();
    w2.editsByChunk = { '0,0': { '4,50,4': STONE } };
    expect(w2.getBlock(4, 50, 4)).toBe(STONE);
  });
  it('setBlock gọi hook onEdit (đồng bộ server)', () => {
    const calls: number[][] = [];
    world.onEdit = (x, y, z, id) => calls.push([x, y, z, id]);
    world.setBlock(1, 40, 1, STONE);
    expect(calls).toEqual([[1, 40, 1, STONE]]);
  });
  it('không cho đặt block ngoài giới hạn cao', () => {
    world.setBlock(0, HEIGHT + 5, 0, STONE);
    expect(world.getBlock(0, HEIGHT + 5, 0)).toBe(AIR);
  });
  it('topSolidY trả về block đặc trên cùng', () => {
    const y = world.topSolidY(8, 8);
    expect(world.isSolid(8, y, 8)).toBe(true);
    expect(world.isSolid(8, y + 1, 8)).toBe(false);
  });
});
