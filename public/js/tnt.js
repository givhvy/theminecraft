// TNT và vụ nổ
import * as THREE from 'three';
import { AIR, BEDROCK, OBSIDIAN, WATER, TNT } from './blocks.js';
import { world } from './world.js';
import { scene } from './scene.js';
import { spawnParticle } from './particles.js';
import { player, damagePlayer } from './player.js';
import { mobs, tntEntities } from './entities.js';
import { sndExplode, sndFuse } from './audio.js';
import { rand01 } from './noise.js';

const tntMat = new THREE.MeshLambertMaterial({ color: 0xd5483c });

export function igniteTNT(bx, by, bz, fuseTime = 1.5) {
  world.setBlock(bx, by, bz, AIR);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.98, 0.98), tntMat.clone());
  mesh.position.set(bx + 0.5, by + 0.5, bz + 0.5);
  scene.add(mesh);
  tntEntities.push({ mesh, fuse: fuseTime, x: bx + 0.5, y: by + 0.5, z: bz + 0.5 });
  sndFuse();
}

export function updateTNT(dt) {
  for (let i = tntEntities.length - 1; i >= 0; i--) {
    const t = tntEntities[i];
    t.fuse -= dt;
    t.mesh.material.color.setHex(Math.sin(performance.now() / 70) > 0 ? 0xffffff : 0xd5483c);
    if (t.fuse <= 0) {
      scene.remove(t.mesh);
      tntEntities.splice(i, 1);
      explode(t.x, t.y, t.z, 3.4, 16);
    }
  }
}

export function explode(ex, ey, ez, radius, maxDmg) {
  sndExplode();
  const r = Math.ceil(radius);
  for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) {
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist > radius * (0.85 + rand01(dx * 7 + dy * 13 + dz * 3) * 0.25)) continue;
    const bx = Math.floor(ex) + dx, by = Math.floor(ey) + dy, bz = Math.floor(ez) + dz;
    const b = world.getBlock(bx, by, bz);
    if (b === AIR || b === BEDROCK || b === OBSIDIAN || b === WATER) continue;
    if (b === TNT) { igniteTNT(bx, by, bz, 0.3 + Math.random() * 0.5); continue; }
    world.setBlock(bx, by, bz, AIR);
  }
  for (let i = 0; i < 70; i++) {
    const hot = Math.random() < 0.5;
    spawnParticle(ex, ey, ez,
      (Math.random() - 0.5) * 14, Math.random() * 10, (Math.random() - 0.5) * 14,
      hot ? 1 : 0.4, hot ? 0.55 : 0.4, hot ? 0.1 : 0.4, 0.7 + Math.random() * 0.6);
  }
  const center = new THREE.Vector3(ex, ey, ez);
  const hurt = (pos, applyFn) => {
    const d = pos.distanceTo(center);
    if (d < radius * 1.9) applyFn(Math.round(maxDmg * (1 - d / (radius * 1.9))));
  };
  hurt(player.pos, dmg => damagePlayer(dmg, center));
  for (let i = mobs.length - 1; i >= 0; i--) {
    const m = mobs[i];
    hurt(m.pos, dmg => m.damage(dmg, center));
  }
}
