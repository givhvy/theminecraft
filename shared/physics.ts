// Va chạm AABB và di chuyển thực thể (logic thuần, không phụ thuộc THREE)
import { world } from './world.js';
import { WATER, LAVA } from './blocks.js';

export interface Vec3Like { x: number; y: number; z: number }
export interface EntityLike {
  pos: Vec3Like;
  vel: Vec3Like;
  halfW: number;
  height: number;
  onGround: boolean;
}
export interface MoveResult { hitX: boolean; hitZ: boolean; landed: boolean; prevVy: number }

export function boxCollides(px: number, py: number, pz: number, halfW: number, height: number): boolean {
  const minX = Math.floor(px - halfW), maxX = Math.floor(px + halfW);
  const minY = Math.floor(py), maxY = Math.floor(py + height);
  const minZ = Math.floor(pz - halfW), maxZ = Math.floor(pz + halfW);
  for (let x = minX; x <= maxX; x++) for (let y = minY; y <= maxY; y++) for (let z = minZ; z <= maxZ; z++) {
    if (y < 0) return true;
    if (world.isSolid(x, y, z)) return true;
  }
  return false;
}

export function moveEntity(e: EntityLike, dt: number): MoveResult {
  const res: MoveResult = { hitX: false, hitZ: false, landed: false, prevVy: e.vel.y };
  let n = e.pos.x + e.vel.x * dt;
  if (!boxCollides(n, e.pos.y, e.pos.z, e.halfW, e.height)) e.pos.x = n; else { e.vel.x = 0; res.hitX = true; }
  n = e.pos.z + e.vel.z * dt;
  if (!boxCollides(e.pos.x, e.pos.y, n, e.halfW, e.height)) e.pos.z = n; else { e.vel.z = 0; res.hitZ = true; }
  e.onGround = false;
  n = e.pos.y + e.vel.y * dt;
  if (!boxCollides(e.pos.x, n, e.pos.z, e.halfW, e.height)) {
    e.pos.y = n;
  } else {
    if (e.vel.y < 0) { e.onGround = true; res.landed = true; }
    e.vel.y = 0;
  }
  return res;
}

export function inWater(x: number, y: number, z: number): boolean {
  return world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z)) === WATER;
}

export function inLava(x: number, y: number, z: number): boolean {
  return world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z)) === LAVA;
}

/** tìm mặt nước (y của block nước cao nhất) quanh vị trí, -1 nếu không có */
export function waterSurfaceY(x: number, y: number, z: number): number {
  const bx = Math.floor(x), bz = Math.floor(z);
  let by = Math.floor(y) + 2;
  for (; by >= Math.floor(y) - 3; by--) {
    if (world.getBlock(bx, by, bz) === WATER) return by;
  }
  return -1;
}
