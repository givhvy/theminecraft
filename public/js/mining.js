// Phá block (giữ chuột), đặt block, tấn công mob, kích nổ TNT
import * as THREE from 'three';
import { AIR, B, TOOLS, TNT, WATER } from './blocks.js';
import { world } from './world.js';
import { camera } from './scene.js';
import { raycastBlock } from './raycast.js';
import { heldItem, showBreakbar, hideBreakbar } from './ui.js';
import { player } from './player.js';
import { mobs } from './entities.js';
import { igniteTNT } from './tnt.js';
import { spawnBlockParticles } from './particles.js';
import { swingHand, isSwinging } from './hand.js';
import { sndBreak, sndPlace } from './audio.js';

export const mining = { breaking: false };

let breakTarget = null, breakProgress = 0, attackCooldown = 0;
const mobRaycaster = new THREE.Raycaster();

function breakTimeFor(blockId) {
  const def = B[blockId];
  if (!def || def.noBreak) return Infinity;
  const it = heldItem();
  let mult = 1;
  if (it.kind === 'tool' && TOOLS[it.id].fast === def.mat) mult = 3.5;
  return Math.max(def.hardness * 0.42 / mult, 0.06);
}

export function updateMining(dt) {
  attackCooldown -= dt;
  if (!mining.breaking || player.dead) {
    breakTarget = null; breakProgress = 0;
    hideBreakbar();
    return;
  }
  // ưu tiên tấn công mob đang nhắm
  mobRaycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  mobRaycaster.far = 3.6;
  const groups = mobs.map(m => m.group);
  const hits = groups.length ? mobRaycaster.intersectObjects(groups, true) : [];
  const blockHit = raycastBlock();
  if (hits.length && (!blockHit || hits[0].distance < blockHit.t)) {
    if (attackCooldown <= 0) {
      attackCooldown = 0.45;
      swingHand();
      let obj = hits[0].object;
      while (obj && !obj.userData.mob) obj = obj.parent;
      if (obj) {
        const it = heldItem();
        const dmg = it.kind === 'tool' ? TOOLS[it.id].dmg : 2;
        obj.userData.mob.damage(dmg, player.pos);
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
  // đập TNT → kích nổ
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

export function placeBlock() {
  if (player.dead) return;
  const it = heldItem();
  if (it.kind !== 'block') return;
  const hit = raycastBlock();
  if (!hit) return;
  const px = hit.x + hit.nx, py = hit.y + hit.ny, pz = hit.z + hit.nz;
  const cur = world.getBlock(px, py, pz);
  if (cur !== AIR && cur !== WATER) return;
  const overlap =
    px + 1 > player.pos.x - player.halfW && px < player.pos.x + player.halfW &&
    pz + 1 > player.pos.z - player.halfW && pz < player.pos.z + player.halfW &&
    py + 1 > player.pos.y && py < player.pos.y + player.height;
  if (overlap && !B[it.id].liquid) return;
  world.setBlock(px, py, pz, it.id);
  swingHand();
  sndPlace(it.id);
}
