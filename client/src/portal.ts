// Portal: đứng trong cổng 2 giây → teleport dimension
import * as THREE from 'three';
import { CHUNK } from '@shared/config';
import { world, switchWorldDimension, getCurrentDimension, worldManager, type WorldMap } from '@shared/world';
import { isInsidePortal, createReturnPortal } from '@shared/portal';
import type { DimensionId } from '@shared/dimensions';
import { buildChunkMesh } from './meshing';
import { scene } from './scene';
import { player, dismount } from './player';
import { mobs } from './entities';
import { boats } from './entities';
import { setDimensionVisuals } from './scene';
import { markAllChunksDirty } from './net';
import { overlay } from './ui';
import { t } from './i18n';

let portalTimer = 0;
let teleporting = false;

function clearWorldMeshes(w: WorldMap): void {
  for (const c of w.chunks.values()) {
    for (const m of c.meshes as THREE.Mesh[]) {
      scene.remove(m);
      m.geometry.dispose();
    }
    c.meshes = [];
  }
  w.chunks.clear();
}

function loadNearbyChunks(w: WorldMap): void {
  const pcx = Math.floor(player.pos.x / CHUNK);
  const pcz = Math.floor(player.pos.z / CHUNK);
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = w.getChunk(pcx + dx, pcz + dz);
    buildChunkMesh(c);
  }
}

export function teleportToDimension(target: DimensionId): void {
  if (teleporting) return;
  teleporting = true;
  dismount();

  const from = getCurrentDimension();
  const fromWorld = worldManager.worlds[from];
  clearWorldMeshes(fromWorld);

  const targetWorld = switchWorldDimension(target);
  targetWorld.editsByChunk = targetWorld.editsByChunk || {};

  // vị trí đích
  if (target === 'nether') {
    player.pos.set(0.5, 36, 0.5);
    createReturnPortal(0, 35, 0, (x, y, z, id) => targetWorld.setBlock(x, y, z, id));
  } else {
    player.pos.set(8.5, 20, 8.5);
    createReturnPortal(8, 19, 0, (x, y, z, id) => targetWorld.setBlock(x, y, z, id));
  }
  player.vel.set(0, 0, 0);

  // xóa mob cũ (chỉ overworld có mob)
  for (let i = mobs.length - 1; i >= 0; i--) mobs[i].remove();
  for (let i = boats.length - 1; i >= 0; i--) boats[i].remove();

  markAllChunksDirty();
  loadNearbyChunks(targetWorld);
  setDimensionVisuals(target);
  portalTimer = 0;
  teleporting = false;
}

export function updatePortal(dt: number): void {
  if (player.dead || player.riding || teleporting) { portalTimer = 0; return; }
  const inside = isInsidePortal(player.pos.x, player.pos.y, player.pos.z, world.getBlock.bind(world));
  if (!inside) { portalTimer = 0; return; }
  portalTimer += dt;
  overlay.style.display = 'none';
  if (portalTimer >= 2) {
    const cur = getCurrentDimension();
    teleportToDimension(cur === 'overworld' ? 'nether' : 'overworld');
  }
}

export function getPortalProgress(): number {
  return Math.min(portalTimer / 2, 1);
}

export function resetPortalTimer(): void {
  portalTimer = 0;
}
