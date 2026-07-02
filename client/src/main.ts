// Điểm khởi động và vòng lặp chính
import { CHUNK } from '@shared/config';
import { world, getCurrentDimension } from '@shared/world';
import { inWater, inLava } from '@shared/physics';
import { renderer, scene, camera, highlight, updateDayNight, getDayTime, sunElevation, getSceneDimension } from './scene';
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
import { loadLocalWorld, isConnected, sendPos, playerCount, net, tickPlayerStateSave } from './net';
import { updateRemotePlayers } from './players';
import { heldItem, itemName, infoEl, watertint, showPortalBar, hidePortalBar } from './ui';
import { mobs } from './entities';
import { sndBird, sndCricket } from './audio';
import { t } from './i18n';
import { updatePortal, getPortalProgress } from './portal';
import './menu';

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
    updatePortal(dt);
  } else {
    hidePortalBar();
  }
  updateChunks(player.pos);
  if (getCurrentDimension() === 'overworld') {
    updateMobs(dt);
    updateBoats(dt);
  }
  updateTNT(dt);
  updateParticles(dt);
  updateDayNight(dt, player.pos);
  updateHand(dt, keys);
  updateBuilder(dt);
  updateRemotePlayers(dt);

  sendPos(player.pos.x, player.pos.y, player.pos.z, player.yaw, player.pitch,
    player.riding ? player.riding.rideKind : null);
  tickPlayerStateSave(player.pos.x, player.pos.y, player.pos.z);

  const portalProg = getPortalProgress();
  if (portalProg > 0) showPortalBar(portalProg);
  else hidePortalBar();

  ambientTimer -= dt;
  if (ambientTimer <= 0 && getSceneDimension() === 'overworld') {
    ambientTimer = 5 + Math.random() * 8;
    if (locked) sunElevation() > 0.1 ? sndBird() : sndCricket();
  }

  const hit = locked ? raycastBlock() : null;
  highlight.visible = !!hit;
  if (hit) highlight.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);

  const camLava = inLava(camera.position.x, camera.position.y, camera.position.z);
  const camWater = !camLava && inWater(camera.position.x, camera.position.y, camera.position.z);
  watertint.style.display = (camWater || camLava) ? 'block' : 'none';
  watertint.style.background = camLava ? 'rgba(230,80,10,0.55)' : 'rgba(20,70,160,0.35)';

  fpsAcc += dt; fpsCount++;
  if (fpsAcc >= 0.5) { fpsShown = Math.round(fpsCount / fpsAcc); fpsAcc = 0; fpsCount = 0; }
  const hourF = (getDayTime() * 24 + 6) % 24;
  const p = player.pos;
  const riding = player.riding ? ` · ${player.riding.rideKind === 'horse' ? t('ridingHorse') : t('ridingBoat')}` : '';
  const dimLabel = getCurrentDimension() === 'nether' ? ` · ${t('nether')}` : '';
  const netLine = isConnected()
    ? `🌐 ${t('online')} · ${t('players')}: ${playerCount()}/10`
    : `💾 ${t('local')}`;
  const profileLine = net.joined ? `${t('profile')}: P${net.slot} · ${net.name}${net.registered ? ' ✓' : ''}<br>` : '';
  infoEl.innerHTML =
    `FPS: ${fpsShown} · ${netLine}${dimLabel}<br>` +
    profileLine +
    `XYZ: ${p.x.toFixed(1)} / ${p.y.toFixed(1)} / ${p.z.toFixed(1)}<br>` +
    `${t('time')}: ${String(hourF | 0).padStart(2, '0')}:${String((hourF % 1) * 60 | 0).padStart(2, '0')} · Mobs: ${mobs.length}<br>` +
    `${t('hand')}: ${itemName(heldItem())}${player.flying ? ` · ${t('flying')}` : ''}${riding}`;

  renderer.render(scene, camera);
}

(function start(): void {
  loadLocalWorld();
  player.pos.copy(findSpawn());
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = world.getChunk(Math.floor(player.pos.x / CHUNK) + dx, Math.floor(player.pos.z / CHUNK) + dz);
    buildChunkMesh(c);
  }
  requestAnimationFrame(loop);
})();
