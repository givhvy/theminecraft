// Công trình sinh tự nhiên rải khắp thế giới (deterministic theo SEED):
// làng dân cư, lâu đài bí ẩn, công viên giải trí mini — mỗi vùng 96×96 block xét một lần
import { SEED, SEA_LEVEL } from './config.js';
import { hash2, terrainHeight } from './noise.js';
import {
  AIR, PLANKS, GLASS, LOG, COBBLE, BRICKS, OBSIDIAN, GLOW, FENCE,
  WOOD_FLOOR, TABLE, CHAIR, BED, BOOKSHELF, POT, CARPET, LAMP,
} from './blocks.js';
import { ferrisWheel, carousel, rollerCoaster } from './themepark.js';

export type BlockPlacement = [x: number, y: number, z: number, id: number];

const REGION = 96; // mỗi vùng 96×96 block xét sinh 1 công trình

export type FeatureKind = 'village' | 'castle' | 'minipark' | null;

export interface Feature {
  kind: Exclude<FeatureKind, null>;
  cx: number; cz: number; baseY: number;
  halfW: number; halfD: number;
  placements: BlockPlacement[];
}

function fillBox(out: BlockPlacement[], x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, id: number): void {
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++)
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++)
      for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z++)
        out.push([x, y, z, id]);
}

// ---- 🏘 làng: 3-5 nhà nhỏ + đường + đèn ----
function genVillage(cx: number, cz: number, y: number, seed: number): BlockPlacement[] {
  const o: BlockPlacement[] = [];
  const houses = 3 + (hash2(seed, seed * 3) * 3 | 0);
  for (let i = 0; i < houses; i++) {
    const hx = cx + Math.round((hash2(seed + i * 7, seed) - 0.5) * 40);
    const hz = cz + Math.round((hash2(seed, seed + i * 11) - 0.5) * 40);
    const w = 3, d = 4;
    fillBox(o, hx - w, y, hz - d, hx + w, y, hz + d, PLANKS);           // sàn
    for (let hy = 1; hy <= 3; hy++) {
      for (let x = hx - w; x <= hx + w; x++) { o.push([x, y + hy, hz - d, PLANKS], [x, y + hy, hz + d, PLANKS]); }
      for (let z = hz - d; z <= hz + d; z++) { o.push([hx - w, y + hy, z, PLANKS], [hx + w, y + hy, z, PLANKS]); }
    }
    for (const [gx, gz] of [[hx - w, hz - d], [hx + w, hz - d], [hx - w, hz + d], [hx + w, hz + d]]) {
      fillBox(o, gx, y + 1, gz, gx, y + 3, gz, LOG);                    // cột góc
    }
    fillBox(o, hx - w - 1, y + 4, hz - d - 1, hx + w + 1, y + 4, hz + d + 1, WOOD_FLOOR); // mái
    o.push([hx, y + 1, hz - d, AIR], [hx, y + 2, hz - d, AIR]);         // cửa
    o.push([hx - 2, y + 2, hz - d, GLASS], [hx + 2, y + 2, hz - d, GLASS]); // cửa sổ
    // nội thất mỗi nhà
    o.push([hx - 2, y + 1, hz + 2, BED], [hx - 1, y + 1, hz + 2, BED]);
    o.push([hx + 2, y + 1, hz + 2, BOOKSHELF]);
    o.push([hx + 1, y + 1, hz, TABLE], [hx + 2, y + 1, hz, CHAIR]);
    o.push([hx, y + 1, hz + 1, CARPET], [hx - 2, y + 1, hz - 1, POT]);
    o.push([hx, y + 3, hz, LAMP]);
  }
  // giếng làng giữa + đèn đường
  fillBox(o, cx - 1, y, cz - 1, cx + 1, y, cz + 1, COBBLE);
  fillBox(o, cx, y + 1, cz, cx, y + 2, cz, GLOW);
  for (let i = 0; i < 6; i++) {
    const lx = cx + Math.round((hash2(seed + i * 13, seed + 5) - 0.5) * 36);
    const lz = cz + Math.round((hash2(seed + 9, seed + i * 17) - 0.5) * 36);
    fillBox(o, lx, y + 1, lz, lx, y + 3, lz, FENCE);
    o.push([lx, y + 4, lz, GLOW]);
  }
  return o;
}

// ---- 🏰 lâu đài bí ẩn: tường đá + 4 tháp + lõi obsidian phát sáng ----
function genCastle(cx: number, cz: number, y: number, seed: number): BlockPlacement[] {
  const o: BlockPlacement[] = [];
  const R = 12, H = 7;
  // tường thành + lỗ châu mai
  for (let x = cx - R; x <= cx + R; x++) for (const z of [cz - R, cz + R]) {
    fillBox(o, x, y + 1, z, x, y + H, z, COBBLE);
    if ((x - cx + R) % 2 === 0) o.push([x, y + H + 1, z, COBBLE]);
  }
  for (let z = cz - R; z <= cz + R; z++) for (const x of [cx - R, cx + R]) {
    fillBox(o, x, y + 1, z, x, y + H, z, COBBLE);
    if ((z - cz + R) % 2 === 0) o.push([x, y + H + 1, z, COBBLE]);
  }
  // 4 tháp góc
  for (const [tx, tz] of [[cx - R, cz - R], [cx + R, cz - R], [cx - R, cz + R], [cx + R, cz + R]]) {
    for (let hy = 1; hy <= H + 5; hy++) {
      for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1], [0, 0]]) {
        o.push([tx + dx, y + hy, tz + dz, hy > H + 3 ? BRICKS : COBBLE]);
      }
    }
    o.push([tx, y + H + 6, tz, GLOW]); // đèn đỉnh tháp — thấy từ xa, đầy bí ẩn
  }
  // cổng vào
  fillBox(o, cx - 1, y + 1, cz - R, cx + 1, y + 3, cz - R, AIR);
  fillBox(o, cx - 2, y + 4, cz - R, cx + 2, y + 4, cz - R, BRICKS);
  // lõi bí ẩn: bàn thờ obsidian giữa sân phát sáng tím
  fillBox(o, cx - 2, y + 1, cz - 2, cx + 2, y + 1, cz + 2, OBSIDIAN);
  fillBox(o, cx, y + 2, cz, cx, y + 3, cz, OBSIDIAN);
  o.push([cx, y + 4, cz, GLOW]);
  for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) {
    fillBox(o, cx + dx, y + 2, cz + dz, cx + dx, y + 2 + (hash2(seed + dx, seed + dz) * 2 | 0), cz + dz, OBSIDIAN);
  }
  return o;
}

// ---- 🎡 công viên mini: đu quay hoặc tàu lượn + vòng xoay ----
function genMiniPark(cx: number, cz: number, y: number, seed: number): BlockPlacement[] {
  const o: BlockPlacement[] = [];
  fillBox(o, cx - 18, y, cz - 18, cx + 18, y, cz + 18, WOOD_FLOOR);
  const roll = hash2(seed + 31, seed + 47);
  if (roll < 0.5) {
    ferrisWheel(o, cx - 6, y, cz);
    carousel(o, cx + 10, y, cz + 6);
  } else {
    rollerCoaster(o, cx - 14, y, cz - 8);
    carousel(o, cx + 8, y, cz + 8);
  }
  for (let i = -12; i <= 12; i += 6) {
    o.push([cx + i, y + 1, cz - 16, GLOW], [cx + i, y + 1, cz + 16, GLOW]);
  }
  return o;
}

const featureCache = new Map<string, Feature | null>();

/** công trình của vùng chứa (rx, rz) — null nếu vùng không có */
export function featureForRegion(rx: number, rz: number): Feature | null {
  const key = rx + ',' + rz;
  if (featureCache.has(key)) return featureCache.get(key)!;

  let f: Feature | null = null;
  // chừa vùng spawn (vùng 0,0 và lân cận đã có công viên chính)
  if (Math.abs(rx) > 1 || Math.abs(rz) > 1) {
    const roll = hash2(rx * 31 + SEED, rz * 57 + SEED * 2);
    let kind: FeatureKind = null;
    if (roll < 0.30) kind = 'village';
    else if (roll < 0.45) kind = 'castle';
    else if (roll < 0.60) kind = 'minipark';
    if (kind) {
      const cx = rx * REGION + REGION / 2 + Math.round((hash2(rx + SEED, rz) - 0.5) * 20);
      const cz = rz * REGION + REGION / 2 + Math.round((hash2(rx, rz + SEED) - 0.5) * 20);
      const baseY = terrainHeight(cx, cz);
      // không sinh dưới nước hoặc trên núi tuyết
      if (baseY > SEA_LEVEL + 1 && baseY < 42) {
        const seed = rx * 7919 + rz * 104729 + SEED;
        const placements =
          kind === 'village' ? genVillage(cx, cz, baseY, seed)
          : kind === 'castle' ? genCastle(cx, cz, baseY, seed)
          : genMiniPark(cx, cz, baseY, seed);
        const halfW = kind === 'village' ? 26 : kind === 'castle' ? 16 : 20;
        f = { kind, cx, cz, baseY, halfW, halfD: halfW, placements };
      }
    }
  }
  featureCache.set(key, f);
  return f;
}

/** stamp mọi công trình giao với chunk này */
export function stampFeaturesIntoChunk(
  data: Uint8Array,
  cx: number, cz: number,
  chunkSize: number, height: number,
  idx: (x: number, y: number, z: number) => number,
): void {
  const minX = cx * chunkSize, minZ = cz * chunkSize;
  const maxX = minX + chunkSize - 1, maxZ = minZ + chunkSize - 1;
  // vùng nào có thể chạm chunk này (công trình rộng tối đa ~52 < REGION nên chỉ cần vùng lân cận)
  const r0x = Math.floor((minX - REGION / 2) / REGION), r1x = Math.floor((maxX + REGION / 2) / REGION);
  const r0z = Math.floor((minZ - REGION / 2) / REGION), r1z = Math.floor((maxZ + REGION / 2) / REGION);

  for (let rx = r0x; rx <= r1x; rx++) for (let rz = r0z; rz <= r1z; rz++) {
    const f = featureForRegion(rx, rz);
    if (!f) continue;
    if (f.cx + f.halfW < minX || f.cx - f.halfW > maxX || f.cz + f.halfD < minZ || f.cz - f.halfD > maxZ) continue;
    for (const [wx, wy, wz, id] of f.placements) {
      if (wx < minX || wx > maxX || wz < minZ || wz > maxZ) continue;
      if (wy < 1 || wy >= height) continue;
      const lx = wx - minX, lz = wz - minZ;
      if (id === AIR) { data[idx(lx, wy, lz)] = AIR; continue; }
      // đổ móng xuống địa hình dốc
      for (let y = Math.max(1, f.baseY - 4); y < wy; y++) {
        if (data[idx(lx, y, lz)] === AIR) data[idx(lx, y, lz)] = y === f.baseY ? 1 : 3;
      }
      data[idx(lx, wy, lz)] = id;
    }
  }
}

/** dùng cho test/minimap: liệt kê công trình quanh một điểm */
export function featuresNear(wx: number, wz: number, radiusRegions = 3): Feature[] {
  const rx = Math.floor(wx / REGION), rz = Math.floor(wz / REGION);
  const out: Feature[] = [];
  for (let dx = -radiusRegions; dx <= radiusRegions; dx++)
    for (let dz = -radiusRegions; dz <= radiusRegions; dz++) {
      const f = featureForRegion(rx + dx, rz + dz);
      if (f) out.push(f);
    }
  return out;
}
