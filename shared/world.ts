// Dữ liệu thế giới: chunk, sinh địa hình, get/set block (logic thuần, không phụ thuộc DOM/THREE)
import { CHUNK, HEIGHT, SEA_LEVEL } from './config.js';
import { AIR, WATER, BEDROCK, LAVA, B, NETHERRACK, GLOW } from './blocks.js';
import { hash2, noise3, terrainHeight } from './noise.js';
import { stampThemeParkIntoChunk } from './themepark.js';
import { stampFeaturesIntoChunk } from './features.js';
import type { DimensionId } from './dimensions.js';

/** dung nham lấp đầy hang động từ y này trở xuống */
export const LAVA_LEVEL = 10;

export interface Chunk {
  data: Uint8Array;
  meshes: unknown[];
  dirty: boolean;
  cx: number;
  cz: number;
}
export type EditMap = Record<string, Record<string, number>>;

export class WorldMap {
  dimension: DimensionId;
  chunks = new Map<string, Chunk>();
  editsByChunk: EditMap = {};
  pendingSave = false;
  /** hook để tầng mạng gửi edit lên server */
  onEdit: ((x: number, y: number, z: number, id: number) => void) | null = null;

  constructor(dimension: DimensionId = 'overworld') {
    this.dimension = dimension;
  }

  key(cx: number, cz: number): string { return cx + ',' + cz; }

  getChunk(cx: number, cz: number): Chunk {
    const k = this.key(cx, cz);
    let c = this.chunks.get(k);
    if (!c) { c = this.generateChunk(cx, cz); this.chunks.set(k, c); }
    return c;
  }

  peekChunk(cx: number, cz: number): Chunk | undefined {
    return this.chunks.get(this.key(cx, cz));
  }

  generateChunk(cx: number, cz: number): Chunk {
    const data = this.dimension === 'nether'
      ? this.generateNetherChunk(cx, cz)
      : this.generateOverworldChunk(cx, cz);
    const edits = this.editsByChunk[this.key(cx, cz)];
    if (edits) {
      const idx = (x: number, y: number, z: number) => (y * CHUNK + z) * CHUNK + x;
      for (const k in edits) {
        const [lx, ly, lz] = k.split(',').map(Number);
        data[idx(lx, ly, lz)] = edits[k];
      }
    }
    return { data, meshes: [], dirty: true, cx, cz };
  }

  private generateOverworldChunk(cx: number, cz: number): Uint8Array {
    const data = new Uint8Array(CHUNK * HEIGHT * CHUNK);
    const idx = (x: number, y: number, z: number) => (y * CHUNK + z) * CHUNK + x;
    for (let x = 0; x < CHUNK; x++) for (let z = 0; z < CHUNK; z++) {
      const wx = cx * CHUNK + x, wz = cz * CHUNK + z;
      const h = terrainHeight(wx, wz);
      for (let y = 0; y <= h; y++) {
        let b = 3;
        if (y === h) b = h <= SEA_LEVEL + 1 ? 6 : (h >= 44 ? 12 : 1);
        else if (y >= h - 3) b = h <= SEA_LEVEL + 1 ? 6 : 2;
        else {
          const r = hash2(wx * 13 + y * 71, wz * 17 + y * 23);
          if (y < 40 && r < 0.012) b = 14;
          else if (y < 28 && r >= 0.012 && r < 0.018) b = 15;
          else if (y < 18 && r >= 0.018 && r < 0.022) b = 16;
          else if (y < 12 && r >= 0.022 && r < 0.0245) b = 17;
          if (y >= 2 && noise3(wx * 0.08, y * 0.13, wz * 0.08) > 0.72) {
            b = y <= LAVA_LEVEL ? LAVA : AIR;
          }
        }
        if (y === 0) b = BEDROCK;
        data[idx(x, y, z)] = b;
      }
      for (let y = h + 1; y <= SEA_LEVEL; y++) data[idx(x, y, z)] = WATER;
    }
    // cây
    for (let x = 2; x < CHUNK - 2; x++) for (let z = 2; z < CHUNK - 2; z++) {
      const wx = cx * CHUNK + x, wz = cz * CHUNK + z;
      if (hash2(wx * 5 + 1, wz * 7 + 3) > 0.012) continue;
      const h = terrainHeight(wx, wz);
      if (h <= SEA_LEVEL + 1 || h >= 44 || h + 9 >= HEIGHT) continue;
      const trunk = 4 + (hash2(wx, wz) * 3 | 0);
      for (let y = h + 1; y <= h + trunk; y++) data[idx(x, y, z)] = 4;
      const topY = h + trunk;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
        if (Math.abs(dx) + Math.abs(dz) + Math.abs(dy) * 1.5 > 3.5) continue;
        const lx = x + dx, ly = topY + dy + 1, lz = z + dz;
        if (lx < 0 || lx >= CHUNK || lz < 0 || lz >= CHUNK || ly >= HEIGHT) continue;
        if (data[idx(lx, ly, lz)] === AIR) data[idx(lx, ly, lz)] = 5;
      }
    }
    // công viên giải trí chính gần spawn
    stampThemeParkIntoChunk(data, cx, cz, CHUNK, HEIGHT, idx);
    // làng, lâu đài bí ẩn, công viên mini rải khắp thế giới
    stampFeaturesIntoChunk(data, cx, cz, CHUNK, HEIGHT, idx);
    return data;
  }

  private generateNetherChunk(cx: number, cz: number): Uint8Array {
    const data = new Uint8Array(CHUNK * HEIGHT * CHUNK);
    const idx = (x: number, y: number, z: number) => (y * CHUNK + z) * CHUNK + x;
    const NETHER_FLOOR = 32;
    const NETHER_CEIL = HEIGHT - 4;

    for (let x = 0; x < CHUNK; x++) for (let z = 0; z < CHUNK; z++) {
      const wx = cx * CHUNK + x, wz = cz * CHUNK + z;
      const bump = (hash2(wx * 3, wz * 5) * 6 | 0);
      const floor = NETHER_FLOOR + bump;
      for (let y = 0; y < HEIGHT; y++) {
        if (y === 0) data[idx(x, y, z)] = BEDROCK;
        else if (y >= NETHER_CEIL) data[idx(x, y, z)] = BEDROCK;
        else if (y <= floor) {
          const r = hash2(wx * 7 + y, wz * 11 + y);
          if (y <= 12 && r < 0.08) data[idx(x, y, z)] = LAVA;
          else if (y >= floor - 1 && r > 0.92) data[idx(x, y, z)] = GLOW;
          else data[idx(x, y, z)] = NETHERRACK;
        } else if (y <= floor + 3 && hash2(wx + y, wz) < 0.04) {
          data[idx(x, y, z)] = NETHERRACK;
        } else {
          data[idx(x, y, z)] = AIR;
        }
      }
      // cột glowstone ngẫu nhiên
      if (hash2(wx * 17, wz * 23) < 0.015) {
        const colH = 3 + (hash2(wx, wz) * 5 | 0);
        for (let y = floor + 1; y <= floor + colH && y < NETHER_CEIL; y++) {
          data[idx(x, y, z)] = GLOW;
        }
      }
    }
    return data;
  }

  getBlock(wx: number, wy: number, wz: number): number {
    if (wy < 0 || wy >= HEIGHT) return AIR;
    const cx = Math.floor(wx / CHUNK), cz = Math.floor(wz / CHUNK);
    const c = this.getChunk(cx, cz);
    return c.data[(wy * CHUNK + (wz - cz * CHUNK)) * CHUNK + (wx - cx * CHUNK)];
  }
  isSolid(wx: number, wy: number, wz: number): boolean {
    const b = this.getBlock(wx, wy, wz);
    return b !== AIR && !B[b]?.liquid && !B[b]?.portal;
  }
  topSolidY(wx: number, wz: number): number {
    for (let y = HEIGHT - 1; y >= 0; y--) {
      if (this.isSolid(wx, y, wz)) return y;
    }
    return 0;
  }

  setBlock(wx: number, wy: number, wz: number, b: number, recordEdit = true): void {
    if (wy < 1 || wy >= HEIGHT) return;
    const cx = Math.floor(wx / CHUNK), cz = Math.floor(wz / CHUNK);
    const c = this.getChunk(cx, cz);
    const x = wx - cx * CHUNK, z = wz - cz * CHUNK;
    c.data[(wy * CHUNK + z) * CHUNK + x] = b;
    c.dirty = true;
    if (recordEdit) {
      const ck = this.key(cx, cz);
      (this.editsByChunk[ck] = this.editsByChunk[ck] || {})[`${x},${wy},${z}`] = b;
      this.pendingSave = true;
      if (this.onEdit) this.onEdit(wx, wy, wz, b);
    }
    if (x === 0) this.markDirty(cx - 1, cz);
    if (x === CHUNK - 1) this.markDirty(cx + 1, cz);
    if (z === 0) this.markDirty(cx, cz - 1);
    if (z === CHUNK - 1) this.markDirty(cx, cz + 1);
  }
  markDirty(cx: number, cz: number): void {
    const c = this.chunks.get(this.key(cx, cz));
    if (c) c.dirty = true;
  }

  clearMeshes(): void {
    this.chunks.clear();
  }
}

export class WorldManager {
  currentDimension: DimensionId = 'overworld';
  readonly worlds: Record<DimensionId, WorldMap> = {
    overworld: new WorldMap('overworld'),
    nether: new WorldMap('nether'),
  };

  get active(): WorldMap { return this.worlds[this.currentDimension]; }

  switchDimension(d: DimensionId): WorldMap {
    this.currentDimension = d;
    world = this.worlds[d];
    return world;
  }
}

export const worldManager = new WorldManager();
export let world = worldManager.worlds.overworld;

export function switchWorldDimension(d: DimensionId): WorldMap {
  return worldManager.switchDimension(d);
}

export function getCurrentDimension(): DimensionId {
  return worldManager.currentDimension;
}
