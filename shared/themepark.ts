// Sinh công viên giải trí ngẫu nhiên (deterministic theo SEED) trên Overworld
import { SEED } from './config.js';
import { hash2 } from './noise.js';
import {
  AIR, PLANKS, GLOW, FENCE, BRICKS, CONCRETE_R, CONCRETE_Y, CONCRETE_BL, CONCRETE_P,
  WOOD_FLOOR, GLASS, LOG,
} from './blocks.js';

export type BlockPlacement = [x: number, y: number, z: number, id: number];

export interface ThemeParkBounds {
  cx: number;
  cz: number;
  halfW: number;
  halfD: number;
  baseY: number;
}

/** vị trí công viên cố định theo SEED — cách spawn ~100–300 block */
export function themeParkLocation(): ThemeParkBounds {
  const angle = hash2(SEED + 777, SEED + 333) * Math.PI * 2;
  const dist = 100 + (hash2(SEED + 111, SEED + 222) * 200 | 0);
  const cx = Math.round(Math.cos(angle) * dist);
  const cz = Math.round(Math.sin(angle) * dist);
  const baseY = 14 + (hash2(cx, cz) * 8 | 0);
  return { cx, cz, halfW: 38, halfD: 38, baseY };
}

function fillBox(out: BlockPlacement[], x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, id: number): void {
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++)
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++)
      for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z++)
        out.push([x, y, z, id]);
}

export function ferrisWheel(out: BlockPlacement[], ox: number, oy: number, oz: number): void {
  const R = 12;
  // chân tháp
  for (let h = 0; h <= 18; h++) {
    out.push([ox - 2, oy + h, oz, CONCRETE_R]);
    out.push([ox + 2, oy + h, oz, CONCRETE_R]);
    out.push([ox, oy + h, oz - 2, CONCRETE_Y]);
    out.push([ox, oy + h, oz + 2, CONCRETE_Y]);
  }
  // vòng tròn cabin
  for (let a = 0; a < 360; a += 15) {
    const rad = a * Math.PI / 180;
    const px = ox + Math.round(Math.cos(rad) * R);
    const pz = oz + Math.round(Math.sin(rad) * R);
    out.push([px, oy + 18, pz, CONCRETE_BL]);
    out.push([px, oy + 17, pz, GLASS]);
  }
  // trục giữa
  fillBox(out, ox, oy + 16, oz, ox, oy + 19, oz, LOG);
}

export function carousel(out: BlockPlacement[], ox: number, oy: number, oz: number): void {
  fillBox(out, ox - 6, oy, oz - 6, ox + 6, oy, oz + 6, CONCRETE_P);
  for (let a = 0; a < 360; a += 60) {
    const rad = a * Math.PI / 180;
    const px = ox + Math.round(Math.cos(rad) * 4);
    const pz = oz + Math.round(Math.sin(rad) * 4);
    fillBox(out, px, oy + 1, pz, px, oy + 3, pz, PLANKS);
    out.push([px, oy + 4, pz, CONCRETE_Y]);
  }
  fillBox(out, ox - 1, oy + 1, oz - 1, ox + 1, oy + 5, oz + 1, CONCRETE_R);
  for (let y = oy + 6; y <= oy + 8; y++) out.push([ox, y, oz, GLOW]);
}

export function rollerCoaster(out: BlockPlacement[], ox: number, oy: number, oz: number): void {
  const pts: [number, number, number][] = [
    [ox, oy + 2, oz], [ox + 4, oy + 4, oz + 3], [ox + 8, oy + 6, oz + 6],
    [ox + 12, oy + 10, oz + 8], [ox + 16, oy + 8, oz + 10], [ox + 20, oy + 5, oz + 12],
    [ox + 24, oy + 3, oz + 14], [ox + 28, oy + 2, oz + 16],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1, z1] = pts[i], [x2, y2, z2] = pts[i + 1];
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), Math.abs(z2 - z1), 1);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = Math.round(x1 + (x2 - x1) * t);
      const y = Math.round(y1 + (y2 - y1) * t);
      const z = Math.round(z1 + (z2 - z1) * t);
      out.push([x, y, z, WOOD_FLOOR]);
      if (s % 3 === 0) out.push([x, y - 1, z, LOG]);
      if (s % 5 === 0) out.push([x, y - 2, z, LOG]);
    }
  }
}

function gate(out: BlockPlacement[], ox: number, oy: number, oz: number): void {
  fillBox(out, ox - 8, oy + 1, oz, ox - 7, oy + 8, oz, BRICKS);
  fillBox(out, ox + 7, oy + 1, oz, ox + 8, oy + 8, oz, BRICKS);
  fillBox(out, ox - 8, oy + 8, oz, ox + 8, oy + 9, oz, CONCRETE_R);
  for (let x = ox - 6; x <= ox + 6; x += 3) out.push([x, oy + 10, oz, GLOW]);
  out.push([ox, oy + 1, oz, AIR]);
  out.push([ox, oy + 2, oz, AIR]);
  out.push([ox, oy + 3, oz, AIR]);
}

function ticketBooth(out: BlockPlacement[], ox: number, oy: number, oz: number): void {
  fillBox(out, ox, oy, oz, ox + 3, oy + 3, oz + 2, PLANKS);
  fillBox(out, ox, oy + 4, oz, ox + 3, oy + 4, oz + 2, CONCRETE_Y);
  out.push([ox + 1, oy + 1, oz, GLASS]);
  out.push([ox + 2, oy + 1, oz, GLASS]);
}

let cachedPlacements: BlockPlacement[] | null = null;
let cachedBounds: ThemeParkBounds | null = null;

export function getThemeParkPlacements(): BlockPlacement[] {
  if (cachedPlacements) return cachedPlacements;
  const b = themeParkLocation();
  cachedBounds = b;
  const out: BlockPlacement[] = [];
  const { cx, cz, halfW, halfD, baseY } = b;

  // nền công viên phẳng
  fillBox(out, cx - halfW, baseY, cz - halfD, cx + halfW, baseY, cz + halfD, WOOD_FLOOR);
  // hàng rào
  for (let x = cx - halfW; x <= cx + halfW; x++) {
    out.push([x, baseY + 1, cz - halfD, FENCE]);
    out.push([x, baseY + 1, cz + halfD, FENCE]);
  }
  for (let z = cz - halfD + 1; z < cz + halfD; z++) {
    out.push([cx - halfW, baseY + 1, z, FENCE]);
    out.push([cx + halfW, baseY + 1, z, FENCE]);
  }

  gate(out, cx, baseY, cz - halfD + 2);
  ticketBooth(out, cx - 20, baseY, cz - 10);
  ticketBooth(out, cx + 16, baseY, cz - 10);
  ferrisWheel(out, cx - 18, baseY, cz + 8);
  carousel(out, cx + 14, baseY, cz + 6);
  rollerCoaster(out, cx - 4, baseY, cz + 18);

  // đèn trang trí
  for (let i = 0; i < 12; i++) {
    const ax = cx - halfW + 6 + (i * 6);
    out.push([ax, baseY + 1, cz - halfD + 4, GLOW]);
    out.push([ax, baseY + 1, cz + halfD - 4, GLOW]);
  }

  cachedPlacements = out;
  return out;
}

export function getThemeParkBounds(): ThemeParkBounds {
  if (!cachedBounds) getThemeParkPlacements();
  return cachedBounds!;
}

/** chunk có giao với công viên không */
export function chunkIntersectsPark(cx: number, cz: number, chunkSize: number): boolean {
  const b = getThemeParkBounds();
  const minX = cx * chunkSize, maxX = minX + chunkSize - 1;
  const minZ = cz * chunkSize, maxZ = minZ + chunkSize - 1;
  return maxX >= b.cx - b.halfW && minX <= b.cx + b.halfW &&
    maxZ >= b.cz - b.halfD && minZ <= b.cz + b.halfD;
}

/** stamp block công viên vào chunk tại toạ độ thế giới */
export function stampThemeParkIntoChunk(
  data: Uint8Array,
  cx: number, cz: number,
  chunkSize: number, height: number,
  idx: (x: number, y: number, z: number) => number,
): void {
  if (!chunkIntersectsPark(cx, cz, chunkSize)) return;
  const b = getThemeParkBounds();
  const minX = cx * chunkSize, minZ = cz * chunkSize;

  for (const [wx, wy, wz, id] of getThemeParkPlacements()) {
    if (wx < minX || wx >= minX + chunkSize || wz < minZ || wz >= minZ + chunkSize) continue;
    if (wy < 0 || wy >= height) continue;
    const lx = wx - minX, lz = wz - minZ;
    if (id === AIR) {
      data[idx(lx, wy, lz)] = AIR;
    } else {
      // san phẳng địa hình dưới công viên
      for (let y = 1; y < wy; y++) data[idx(lx, y, lz)] = id === WOOD_FLOOR ? 2 : 3;
      data[idx(lx, wy, lz)] = id;
    }
  }

  // san phẳng vùng nền công viên
  for (let lx = 0; lx < chunkSize; lx++) for (let lz = 0; lz < chunkSize; lz++) {
    const wx = minX + lx, wz = minZ + lz;
    if (Math.abs(wx - b.cx) <= b.halfW && Math.abs(wz - b.cz) <= b.halfD) {
      for (let y = b.baseY + 1; y < height - 1; y++) {
        if (data[idx(lx, y, lz)] !== AIR && data[idx(lx, y, lz)] !== GLOW) continue;
      }
    }
  }
}

/** ngựa spawn nhiều hơn gần công viên */
export function isNearThemePark(wx: number, wz: number, extra = 20): boolean {
  const b = getThemeParkBounds();
  return Math.abs(wx - b.cx) <= b.halfW + extra && Math.abs(wz - b.cz) <= b.halfD + extra;
}
