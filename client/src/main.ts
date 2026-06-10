// Điểm khởi động và vòng lặp chính
import { CHUNK } from '@shared/config';
import { world } from '@shared/world';
import { inWater } from '@shared/physics';
import { renderer, scene, camera, highlight, updateDayNight, getDayTime, sunElevation } from './scene';
import { buildChunkMesh, updateChunks } from './meshing';
import { player, updatePlayer, findSpawn } from './player';
import { keys, isLocked } from './controls';
import { updateMining } from './mining';
import { updateMobs } from './mobs';
import { updateBoats } from './boat';
import { updateTNT } from './tnt';
import { updateParticles } from './particles';
import { updateHand } from './hand';
import { updateBuilder } from './builder';
import { raycastBlock } from './raycast';
import { connect, isConnected } from './net';
import { heldItem, itemName, infoEl, watertint } from './ui';
import { mobs } from './entities';
import { sndBird, sndCricket } from './audio';

let lastTime = performance.now();
let fpsAcc = 0, fpsCount = 0, fpsShown = 0;
let ambientTimer = 5;

function loop(now: number): void {
  requestAnimationFrame(loop);
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  const locked = isLocked();

  if (locked && !player.dead) {
    updatePlayer(dt, keys);
    updateMining(dt);
  }
  updateChunks(player.pos);
  updateMobs(dt);
  updateBoats(dt);
  updateTNT(dt);
  updateParticles(dt);
  updateDayNight(dt, player.pos);
  updateHand(dt, keys);
  updateBuilder(dt);

  ambientTimer -= dt;
  if (ambientTimer <= 0) {
    ambientTimer = 5 + Math.random() * 8;
    if (locked) sunElevation() > 0.1 ? sndBird() : sndCricket();
  }

  const hit = locked ? raycastBlock() : null;
  highlight.visible = !!hit;
  if (hit) highlight.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);

  watertint.style.display = inWater(camera.position.x, camera.position.y, camera.position.z) ? 'block' : 'none';

  fpsAcc += dt; fpsCount++;
  if (fpsAcc >= 0.5) { fpsShown = Math.round(fpsCount / fpsAcc); fpsAcc = 0; fpsCount = 0; }
  const hourF = (getDayTime() * 24 + 6) % 24;
  const p = player.pos;
  const riding = player.riding ? (player.riding.rideKind === 'horse' ? ' · 🐴 cưỡi ngựa (Shift xuống)' : ' · 🛶 trên thuyền (Shift xuống)') : '';
  infoEl.innerHTML =
    `FPS: ${fpsShown} · ${isConnected() ? '🌐 server' : '💾 local'}<br>` +
    `XYZ: ${p.x.toFixed(1)} / ${p.y.toFixed(1)} / ${p.z.toFixed(1)}<br>` +
    `Giờ: ${String(hourF | 0).padStart(2, '0')}:${String((hourF % 1) * 60 | 0).padStart(2, '0')} · Mobs: ${mobs.length}<br>` +
    `Tay: ${itemName(heldItem())}${player.flying ? ' · ✈ bay' : ''}${riding}`;

  renderer.render(scene, camera);
}

(async function start(): Promise<void> {
  await connect();
  player.pos.copy(findSpawn());
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = world.getChunk(Math.floor(player.pos.x / CHUNK) + dx, Math.floor(player.pos.z / CHUNK) + dz);
    buildChunkMesh(c);
  }
  requestAnimationFrame(loop);
})();
