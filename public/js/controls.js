// Bàn phím, chuột, pointer lock, trạng thái overlay
import { canvas } from './scene.js';
import { player, respawn } from './player.js';
import { overlay, setSlot, getSlot, toggleInventory, inventoryOpen, uiEvents } from './ui.js';
import * as ui from './ui.js';
import { mining, placeBlock } from './mining.js';
import { toggleBuilder, builderOpen } from './builder.js';
import * as builderMod from './builder.js';
import { audio } from './audio.js';

export const keys = {};
export let locked = false;
export function isLocked() { return locked; }

function anyModalOpen() { return ui.inventoryOpen || builderMod.builderOpen; }
function refreshOverlay() {
  overlay.style.display = (locked || anyModalOpen() || player.dead) ? 'none' : 'flex';
}

overlay.addEventListener('click', () => { audio(); canvas.requestPointerLock(); });
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas;
  refreshOverlay();
  if (!locked) mining.breaking = false;
});
uiEvents.addEventListener('modalopen', () => { document.exitPointerLock(); refreshOverlay(); });
uiEvents.addEventListener('modalclose', () => { canvas.requestPointerLock(); });

document.addEventListener('mousemove', (e) => {
  if (!locked) return;
  player.yaw -= e.movementX * 0.0024;
  player.pitch -= e.movementY * 0.0024;
  player.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, player.pitch));
});
document.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'KeyF' && locked) { player.flying = !player.flying; player.vel.y = 0; }
  if (e.code === 'KeyE' && (locked || ui.inventoryOpen)) toggleInventory();
  if (e.code === 'KeyB' && (locked || builderMod.builderOpen)) toggleBuilder();
  const n = parseInt(e.key);
  if (n >= 1 && n <= 9 && locked) setSlot(n - 1);
});
document.addEventListener('keyup', (e) => { keys[e.code] = false; });
document.addEventListener('wheel', (e) => {
  if (!locked) return;
  setSlot((getSlot() + (e.deltaY > 0 ? 1 : -1) + 9) % 9);
});
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('mousedown', (e) => {
  if (!locked) return;
  if (e.button === 0) mining.breaking = true;
  if (e.button === 2) placeBlock();
});
document.addEventListener('mouseup', (e) => { if (e.button === 0) mining.breaking = false; });

document.getElementById('respawnbtn').addEventListener('click', () => {
  respawn();
  canvas.requestPointerLock();
});
