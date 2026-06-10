// Raycast voxel (DDA) từ camera
import * as THREE from 'three';
import { REACH } from '@shared/config';
import { AIR, WATER } from '@shared/blocks';
import { world } from '@shared/world';
import { camera } from './scene';

export interface BlockHit { x: number; y: number; z: number; nx: number; ny: number; nz: number; t: number; block: number }

export function raycastBlock(): BlockHit | null {
  const dir = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation).normalize();
  const o = camera.position;
  let x = Math.floor(o.x), y = Math.floor(o.y), z = Math.floor(o.z);
  const stepX = Math.sign(dir.x) || 1, stepY = Math.sign(dir.y) || 1, stepZ = Math.sign(dir.z) || 1;
  const tDeltaX = Math.abs(1 / (dir.x || 1e-10));
  const tDeltaY = Math.abs(1 / (dir.y || 1e-10));
  const tDeltaZ = Math.abs(1 / (dir.z || 1e-10));
  let tMaxX = tDeltaX * (stepX > 0 ? (x + 1 - o.x) : (o.x - x));
  let tMaxY = tDeltaY * (stepY > 0 ? (y + 1 - o.y) : (o.y - y));
  let tMaxZ = tDeltaZ * (stepZ > 0 ? (z + 1 - o.z) : (o.z - z));
  let nx = 0, ny = 0, nz = 0, t = 0;
  while (t <= REACH) {
    const b = world.getBlock(x, y, z);
    if (b !== AIR && b !== WATER) return { x, y, z, nx, ny, nz, t, block: b };
    if (tMaxX < tMaxY && tMaxX < tMaxZ) { x += stepX; t = tMaxX; tMaxX += tDeltaX; nx = -stepX; ny = 0; nz = 0; }
    else if (tMaxY < tMaxZ) { y += stepY; t = tMaxY; tMaxY += tDeltaY; nx = 0; ny = -stepY; nz = 0; }
    else { z += stepZ; t = tMaxZ; tMaxZ += tDeltaZ; nx = 0; ny = 0; nz = -stepZ; }
  }
  return null;
}

/** raycast tới mặt nước (để đặt thuyền) */
export function raycastWater(): { x: number; y: number; z: number } | null {
  const dir = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation).normalize();
  const o = camera.position;
  for (let t = 0.5; t <= REACH; t += 0.25) {
    const x = Math.floor(o.x + dir.x * t), y = Math.floor(o.y + dir.y * t), z = Math.floor(o.z + dir.z * t);
    const b = world.getBlock(x, y, z);
    if (b === WATER) return { x, y, z };
    if (b !== AIR) return null;
  }
  return null;
}
