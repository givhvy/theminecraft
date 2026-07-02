// Dữ liệu thế giới: chunk, sinh địa hình, get/set block (logic thuần, không phụ thuộc DOM/THREE)
import { CHUNK, HEIGHT, SEA_LEVEL } from './config.js';
import { AIR, WATER, BEDROCK, LAVA, B } from './blocks.js';
import { hash2, noise3, terrainHeight } from './noise.js';

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
  chunks = new Map<string, Chunk>();
  editsByChunk: EditMap = {};
  pendingSave = false;
  /** hook để tầng mạng gửi edit lên server */
  onEdit: ((x: number, y: number, z: number, id: number) => void) | null = null;

  key(cx: number, cz: number): string { return cx + ',' + cz; }

  getChunk(cx: number, cz: number): Chunk {
    const k = this.key(cx, cz);
    let c = this.chunks.get(k);
    if (!c) { c = this.generateChunk(cx, cz); this.chunks.set(k, c); }
    return c;
  }

  /** đọc chunk nếu đã sinh, không kích hoạt sinh mới (cho vòng lặp render tránh giật) */
  peekChunk(cx: number, cz: number): Chunk | undefined {
    return this.chunks.get(this.key(cx, cz));
  }

  generateChunk(cx: number, cz: number): Chunk {
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
          // hang động: khoét bằng noise 3D, dưới LAVA_LEVEL lấp dung nham
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
    // áp dụng chỉnh sửa đã lưu
    const edits = this.editsByChunk[this.key(cx, cz)];
    if (edits) for (const k in edits) {
      const [lx, ly, lz] = k.split(',').map(Number);
      data[idx(lx, ly, lz)] = edits[k];
    }
    return { data, meshes: [], dirty: true, cx, cz };
  }

  getBlock(wx: number, wy: number, wz: number): number {
    if (wy < 0 || wy >= HEIGHT) return AIR;
    const cx = Math.floor(wx / CHUNK), cz = Math.floor(wz / CHUNK);
    const c = this.getChunk(cx, cz);
    return c.data[(wy * CHUNK + (wz - cz * CHUNK)) * CHUNK + (wx - cx * CHUNK)];
  }
  isSolid(wx: number, wy: number, wz: number): boolean {
    const b = this.getBlock(wx, wy, wz);
    return b !== AIR && !B[b]?.liquid;
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
}

export const world = new WorldMap();
