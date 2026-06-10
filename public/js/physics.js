// Va chạm AABB và di chuyển thực thể
import { world } from './world.js';
import { WATER } from './blocks.js';

export function boxCollides(px, py, pz, halfW, height) {
  const minX = Math.floor(px - halfW), maxX = Math.floor(px + halfW);
  const minY = Math.floor(py), maxY = Math.floor(py + height);
  const minZ = Math.floor(pz - halfW), maxZ = Math.floor(pz + halfW);
  for (let x = minX; x <= maxX; x++) for (let y = minY; y <= maxY; y++) for (let z = minZ; z <= maxZ; z++) {
    if (y < 0) return true;
    if (world.isSolid(x, y, z)) return true;
  }
  return false;
}

// Di chuyển theo từng trục; trả về thông tin va chạm
export function moveEntity(e, dt) {
  const res = { hitX: false, hitZ: false, landed: false, prevVy: e.vel.y };
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

export function inWater(x, y, z) {
  return world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z)) === WATER;
}
