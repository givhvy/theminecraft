// HUD: hotbar, kho đồ, tim, thanh phá block, overlay, info
import { B, TOOLS, TNT, GLOW, type ToolId } from '@shared/blocks';
import { tileToDataURL, drawToolIcon } from './textures';
import { sndSlot, sndOpen, sndClose, sndClick } from './audio';

export const uiEvents = new EventTarget();

export type Item =
  | { kind: 'tool'; id: ToolId }
  | { kind: 'block'; id: number }
  | { kind: 'boat' };

export const hotbarItems: Item[] = [
  { kind: 'tool', id: 'sword' }, { kind: 'tool', id: 'pickaxe' },
  { kind: 'tool', id: 'axe' }, { kind: 'tool', id: 'shovel' },
  { kind: 'block', id: 1 }, { kind: 'block', id: 3 },
  { kind: 'block', id: 7 }, { kind: 'block', id: GLOW }, { kind: 'block', id: TNT },
];
let slot = 0;
export function getSlot(): number { return slot; }
export function heldItem(): Item { return hotbarItems[slot]; }

const iconCache: Record<string, string> = {};
export function itemIcon(item: Item): string {
  const k = item.kind + ':' + ('id' in item ? item.id : '');
  if (!iconCache[k]) {
    iconCache[k] =
      item.kind === 'tool' ? drawToolIcon(item.id) :
      item.kind === 'boat' ? drawToolIcon('boat') :
      tileToDataURL(B[item.id].tiles.side);
  }
  return iconCache[k];
}
export function itemName(item: Item): string {
  return item.kind === 'tool' ? TOOLS[item.id].name : item.kind === 'boat' ? 'Thuyền' : B[item.id].name;
}

const hotbarEl = document.getElementById('hotbar')!;
export function renderHotbar(): void {
  hotbarEl.innerHTML = '';
  hotbarItems.forEach((it, i) => {
    const div = document.createElement('div');
    div.className = 'slot' + (i === slot ? ' active' : '');
    div.innerHTML = `<span class="num">${i + 1}</span><img src="${itemIcon(it)}" alt="${itemName(it)}">`;
    hotbarEl.appendChild(div);
  });
}
export function setSlot(i: number, silent = false): void {
  slot = i;
  renderHotbar();
  if (!silent) sndSlot();
  uiEvents.dispatchEvent(new Event('slotchange'));
}
renderHotbar();

// ---- kho đồ (E) ----
export let inventoryOpen = false;
const invEl = document.getElementById('inventory')!;
const invGrid = document.getElementById('invgrid')!;
{
  const entries: Item[] = (Object.keys(TOOLS) as ToolId[]).map(id => ({ kind: 'tool', id }));
  entries.push({ kind: 'boat' });
  for (const id in B) {
    if (B[Number(id)].noBreak) continue;
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
export function toggleInventory(): void {
  inventoryOpen = !inventoryOpen;
  invEl.style.display = inventoryOpen ? 'block' : 'none';
  inventoryOpen ? sndOpen() : sndClose();
  uiEvents.dispatchEvent(new Event(inventoryOpen ? 'modalopen' : 'modalclose'));
}

// ---- tim ----
const heartsEl = document.getElementById('hearts')!;
export function updateHearts(hp: number): void {
  const full = Math.ceil(Math.max(hp, 0) / 2);
  let s = '';
  for (let i = 0; i < 10; i++) s += `<span style="color:${i < full ? '#e33' : '#3a3a3a'}">❤</span>`;
  heartsEl.innerHTML = s;
}

// ---- thanh phá block ----
const breakbar = document.getElementById('breakbar')!;
const breakFill = breakbar.firstElementChild as HTMLElement;
export function showBreakbar(progress: number): void {
  breakbar.style.display = 'block';
  breakFill.style.width = Math.min(progress * 100, 100) + '%';
}
export function hideBreakbar(): void { breakbar.style.display = 'none'; }

// ---- các phần tử khác ----
export const overlay = document.getElementById('overlay')!;
export const vignette = document.getElementById('vignette')!;
export const watertint = document.getElementById('watertint')!;
export const deathscreen = document.getElementById('deathscreen')!;
export const infoEl = document.getElementById('info')!;
export const buildInfoEl = document.getElementById('buildinfo')!;
export const saveStateEl = document.getElementById('savestate')!;

export function flashVignette(): void {
  vignette.style.opacity = '1';
  setTimeout(() => { vignette.style.opacity = '0'; }, 180);
}
export function showSaved(): void {
  saveStateEl.style.opacity = '1';
  setTimeout(() => { saveStateEl.style.opacity = '0'; }, 1200);
}
