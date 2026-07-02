// Bàn phím, chuột, pointer lock, trạng thái overlay
import { canvas } from './scene';
import { player, respawn, dismount } from './player';
import { overlay, setSlot, getSlot, toggleInventory, uiEvents } from './ui';
import * as ui from './ui';
import { mining, interact } from './mining';
import { toggleBuilder } from './builder';
import * as builderMod from './builder';

export const keys: Record<string, boolean | undefined> = {};
let locked = false;
export function isLocked(): boolean { return locked; }

function anyModalOpen(): boolean { return ui.inventoryOpen || builderMod.builderOpen; }
function refreshOverlay(): void {
  overlay.style.display = (locked || anyModalOpen() || player.dead) ? 'none' : 'flex';
}

// nút "Chơi" trong menu.ts đảm nhận việc join + requestPointerLock
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
  if (e.target instanceof HTMLInputElement) return; // đang gõ vào ô nhập tên/tài khoản
  keys[e.code] = true;
  if (e.code === 'KeyF' && locked && !player.riding) { player.flying = !player.flying; player.vel.y = 0; }
  if (e.code === 'KeyE' && (locked || ui.inventoryOpen)) toggleInventory();
  if (e.code === 'KeyB' && (locked || builderMod.builderOpen)) toggleBuilder();
  if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && player.riding) dismount();
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
  if (e.button === 2) interact();
});
document.addEventListener('mouseup', (e) => { if (e.button === 0) mining.breaking = false; });

document.getElementById('respawnbtn')!.addEventListener('click', () => {
  respawn();
  canvas.requestPointerLock();
});
