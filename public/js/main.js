// Điểm khởi động và vòng lặp chính của game
import { CHUNK } from './config.js';
import { world } from './world.js';
import { renderer, scene, camera, highlight, updateDayNight, getDayTime, sunElevation } from './scene.js';
import { buildChunkMesh, updateChunks } from './meshing.js';
import { player, updatePlayer, findSpawn } from './player.js';
import { keys, isLocked } from './controls.js';
import { updateMining } from './mining.js';
import { updateMobs } from './mobs.js';
import { updateTNT } from './tnt.js';
import { updateParticles } from './particles.js';
import { updateHand } from './hand.js';
import { updateBuilder } from './builder.js';
import { raycastBlock } from './raycast.js';
import { inWater } from './physics.js';
import { loadWorld, isUsingServer } from './save.js';
import { heldItem, itemName, infoEl, watertint } from './ui.js';
import { mobs } from './entities.js';
import { sndBird, sndCricket } from './audio.js';

let lastTime = performance.now();
let fpsAcc = 0, fpsCount = 0, fpsShown = 0;
let ambientTimer = 5;

function loop(now) {
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
  updateTNT(dt);
  updateParticles(dt);
  updateDayNight(dt, player.pos);
  updateHand(dt, keys);
  updateBuilder(dt);

  // âm thanh môi trường: chim ban ngày, dế ban đêm
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
  infoEl.innerHTML =
    `FPS: ${fpsShown} · ${isUsingServer() ? '🌐 server' : '💾 local'}<br>` +
    `XYZ: ${p.x.toFixed(1)} / ${p.y.toFixed(1)} / ${p.z.toFixed(1)}<br>` +
    `Giờ: ${String(hourF | 0).padStart(2, '0')}:${String((hourF % 1) * 60 | 0).padStart(2, '0')} · Mobs: ${mobs.length}<br>` +
    `Tay: ${itemName(heldItem())}${player.flying ? ' · ✈ bay' : ''}`;

  renderer.render(scene, camera);
}

(async function start() {
  await loadWorld();
  player.pos.copy(findSpawn());
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = world.getChunk(Math.floor(player.pos.x / CHUNK) + dx, Math.floor(player.pos.z / CHUNK) + dz);
    buildChunkMesh(c);
  }
  requestAnimationFrame(loop);
})();
