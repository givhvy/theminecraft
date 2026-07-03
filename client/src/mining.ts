// Phá block, đặt block, tấn công mob, kích nổ TNT, cưỡi ngựa/thuyền, đặt thuyền, kích hoạt portal
import * as THREE from 'three';
import { AIR, B, TOOLS, TNT, toolIsFast } from '@shared/blocks';
import { world } from '@shared/world';
import { findPortalFrameAt, activatePortal } from '@shared/portal';
import { camera } from './scene';
import { raycastBlock, raycastWater } from './raycast';
import { heldItem, showBreakbar, hideBreakbar } from './ui';
import { player, mount } from './player';
import { mobs, boats } from './entities';
import { Boat } from './boat';
import { igniteTNT } from './tnt';
import { spawnBlockParticles } from './particles';
import { swingHand, isSwinging } from './hand';
import { sndBreak, sndPlace, sndMount, sndEggPop } from './audio';
import { spawnMobAt, type Mob } from './mobs';

export const mining = { breaking: false };

let breakTarget: string | null = null;
let breakProgress = 0;
let attackCooldown = 0;
const rideRaycaster = new THREE.Raycaster();

function breakTimeFor(blockId: number): number {
  const def = B[blockId];
  if (!def || def.noBreak) return Infinity;
  const it = heldItem();
  let mult = 1;
  if (it.kind === 'tool' && toolIsFast(TOOLS[it.id], def.mat)) mult = TOOLS[it.id].speed ?? 3.5;
  return Math.max(def.hardness * 0.42 / mult, 0.06);
}

function findMob(obj: THREE.Object3D | null): Mob | null {
  while (obj) {
    if (obj.userData.mob) return obj.userData.mob as Mob;
    obj = obj.parent;
  }
  return null;
}
function findBoat(obj: THREE.Object3D | null): Boat | null {
  while (obj) {
    if (obj.userData.boat) return obj.userData.boat as Boat;
    obj = obj.parent;
  }
  return null;
}

export function updateMining(dt: number): void {
  attackCooldown -= dt;
  if (!mining.breaking || player.dead) {
    breakTarget = null; breakProgress = 0;
    hideBreakbar();
    return;
  }
  rideRaycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  rideRaycaster.far = 3.6;
  const targets: THREE.Object3D[] = [...mobs.map(m => m.group), ...boats.map(b => b.group)];
  const hits = targets.length ? rideRaycaster.intersectObjects(targets, true) : [];
  const blockHit = raycastBlock();
  if (hits.length && (!blockHit || hits[0].distance < blockHit.t)) {
    if (attackCooldown <= 0) {
      attackCooldown = 0.45;
      swingHand();
      const mob = findMob(hits[0].object);
      const boat = findBoat(hits[0].object);
      if (mob) {
        const it = heldItem();
        const dmg = it.kind === 'tool' ? TOOLS[it.id].dmg : 2;
        mob.damage(dmg, player.pos);
      } else if (boat && !boat.ridden) {
        boat.remove(); // đập thuyền → gỡ thuyền
        sndBreak(7);
      }
    }
    breakTarget = null; breakProgress = 0;
    hideBreakbar();
    return;
  }
  if (!blockHit) {
    breakTarget = null; breakProgress = 0;
    hideBreakbar();
    if (attackCooldown <= 0) { attackCooldown = 0.35; swingHand(); }
    return;
  }
  if (blockHit.block === TNT) {
    swingHand();
    igniteTNT(blockHit.x, blockHit.y, blockHit.z);
    breakTarget = null; breakProgress = 0;
    return;
  }
  const key = blockHit.x + ',' + blockHit.y + ',' + blockHit.z;
  if (breakTarget !== key) { breakTarget = key; breakProgress = 0; }
  const need = breakTimeFor(blockHit.block);
  if (need === Infinity) { hideBreakbar(); return; }
  breakProgress += dt / need;
  if (!isSwinging()) swingHand();
  showBreakbar(breakProgress);
  if (breakProgress >= 1) {
    spawnBlockParticles(blockHit.x, blockHit.y, blockHit.z, blockHit.block);
    sndBreak(blockHit.block);
    world.setBlock(blockHit.x, blockHit.y, blockHit.z, AIR);
    breakTarget = null; breakProgress = 0;
  }
}

/** chuột phải: cưỡi ngựa/thuyền > đặt thuyền > đặt block */
export function interact(): void {
  if (player.dead || player.riding) return;

  // 1. cưỡi ngựa / lên thuyền nếu đang nhắm vào
  rideRaycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  rideRaycaster.far = 3.6;
  const targets: THREE.Object3D[] = [
    ...mobs.filter(m => m.type === 'horse').map(m => m.group),
    ...boats.map(b => b.group),
  ];
  const hits = targets.length ? rideRaycaster.intersectObjects(targets, true) : [];
  if (hits.length) {
    const mob = findMob(hits[0].object);
    const boat = findBoat(hits[0].object);
    if (mob && mob.type === 'horse') { mount(mob); sndMount(); return; }
    if (boat) { mount(boat); sndMount(); return; }
  }

  const it = heldItem();

  // 2a. lửa mồi → kích hoạt portal obsidian
  if (it.kind === 'igniter') {
    const hit = raycastBlock();
    if (hit) {
      const frame = findPortalFrameAt(hit.x, hit.y, hit.z, world.getBlock.bind(world));
      if (frame) {
        activatePortal(frame, (x, y, z, id) => world.setBlock(x, y, z, id));
        swingHand();
        sndPlace(41);
      }
    }
    return;
  }

  // 2b. trứng spawn → thả con vật ra chỗ nhắm
  if (it.kind === 'egg') {
    const hit = raycastBlock();
    if (hit) {
      spawnMobAt(it.id, hit.x + hit.nx + 0.5, hit.y + hit.ny + 0.3, hit.z + hit.nz + 0.5);
      swingHand();
      sndEggPop();
    }
    return;
  }

  // 2. đặt thuyền lên mặt nước
  if (it.kind === 'boat') {
    const w = raycastWater();
    if (w) {
      new Boat(w.x + 0.5, w.y + 0.8, w.z + 0.5);
      swingHand();
    }
    return;
  }

  // 3. đặt block
  if (it.kind !== 'block') return;
  const hit = raycastBlock();
  if (!hit) return;
  const px = hit.x + hit.nx, py = hit.y + hit.ny, pz = hit.z + hit.nz;
  const cur = world.getBlock(px, py, pz);
  if (cur !== AIR && !B[cur]?.liquid) return;
  const overlap =
    px + 1 > player.pos.x - player.halfW && px < player.pos.x + player.halfW &&
    pz + 1 > player.pos.z - player.halfW && pz < player.pos.z + player.halfW &&
    py + 1 > player.pos.y && py < player.pos.y + player.height;
  if (overlap && !B[it.id].liquid) return;
  world.setBlock(px, py, pz, it.id);
  swingHand();
  sndPlace(it.id);
}
