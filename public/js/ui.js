// HUD: hotbar, kho đồ, tim, thanh phá block, overlay, info
import { B, TOOLS, TNT, GLOW } from './blocks.js';
import { tileToDataURL, drawToolIcon } from './textures.js';
import { sndSlot, sndOpen, sndClose, sndClick } from './audio.js';

export const uiEvents = new EventTarget();

// ---- hotbar ----
export const hotbarItems = [
  { kind: 'tool', id: 'sword' }, { kind: 'tool', id: 'pickaxe' },
  { kind: 'tool', id: 'axe' }, { kind: 'tool', id: 'shovel' },
  { kind: 'block', id: 1 }, { kind: 'block', id: 3 },
  { kind: 'block', id: 7 }, { kind: 'block', id: GLOW }, { kind: 'block', id: TNT },
];
let slot = 0;
export function getSlot() { return slot; }
export function heldItem() { return hotbarItems[slot]; }

const iconCache = {};
export function itemIcon(item) {
  const k = item.kind + ':' + item.id;
  if (!iconCache[k]) {
    iconCache[k] = item.kind === 'tool' ? drawToolIcon(item.id) : tileToDataURL(B[item.id].tiles.side);
  }
  return iconCache[k];
}
export function itemName(item) { return item.kind === 'tool' ? TOOLS[item.id].name : B[item.id].name; }

const hotbarEl = document.getElementById('hotbar');
export function renderHotbar() {
  hotbarEl.innerHTML = '';
  hotbarItems.forEach((it, i) => {
    const div = document.createElement('div');
    div.className = 'slot' + (i === slot ? ' active' : '');
    div.innerHTML = `<span class="num">${i + 1}</span><img src="${itemIcon(it)}" alt="${itemName(it)}">`;
    hotbarEl.appendChild(div);
  });
}
export function setSlot(i, silent = false) {
  slot = i;
  renderHotbar();
  if (!silent) sndSlot();
  uiEvents.dispatchEvent(new Event('slotchange'));
}
renderHotbar();

// ---- kho đồ (E) ----
export let inventoryOpen = false;
const invEl = document.getElementById('inventory');
const invGrid = document.getElementById('invgrid');
{
  const entries = Object.keys(TOOLS).map(id => ({ kind: 'tool', id }));
  for (const id in B) {
    if (B[id].noBreak) continue;
    entries.push({ kind: 'block', id: Number(id) });
  }
  for (const it of entries) {
    const cell = document.createElement('div');
    cell.className = 'invcell';
    cell.title = itemName(it);
    cell.innerHTML = `<img src="${itemIcon(it)}" alt="${itemName(it)}">`;
    cell.addEventListener('click', () => {
      hotbarItems[slot] = it;
      sndClick();
      setSlot(slot, true);
      toggleInventory();
    });
    invGrid.appendChild(cell);
  }
}
export function toggleInventory() {
  inventoryOpen = !inventoryOpen;
  invEl.style.display = inventoryOpen ? 'block' : 'none';
  inventoryOpen ? sndOpen() : sndClose();
  uiEvents.dispatchEvent(new Event(inventoryOpen ? 'modalopen' : 'modalclose'));
}

// ---- tim ----
const heartsEl = document.getElementById('hearts');
export function updateHearts(hp) {
  const full = Math.ceil(Math.max(hp, 0) / 2);
  let s = '';
  for (let i = 0; i < 10; i++) s += `<span style="color:${i < full ? '#e33' : '#3a3a3a'}">❤</span>`;
  heartsEl.innerHTML = s;
}

// ---- thanh phá block ----
const breakbar = document.getElementById('breakbar');
const breakFill = breakbar.firstElementChild;
export function showBreakbar(progress) {
  breakbar.style.display = 'block';
  breakFill.style.width = Math.min(progress * 100, 100) + '%';
}
export function hideBreakbar() { breakbar.style.display = 'none'; }

// ---- các phần tử khác ----
export const overlay = document.getElementById('overlay');
export const vignette = document.getElementById('vignette');
export const watertint = document.getElementById('watertint');
export const deathscreen = document.getElementById('deathscreen');
export const infoEl = document.getElementById('info');
export const buildInfoEl = document.getElementById('buildinfo');
export const saveStateEl = document.getElementById('savestate');

export function flashVignette() {
  vignette.style.opacity = '1';
  setTimeout(() => vignette.style.opacity = '0', 180);
}
export function showSaved() {
  saveStateEl.style.opacity = '1';
  setTimeout(() => saveStateEl.style.opacity = '0', 1200);
}
