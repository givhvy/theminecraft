// HUD: hotbar, kho đồ tab, tim, thanh phá block
import { B, TNT, GLOW, TOOLS, FURNITURE_IDS, IGNITER, type ToolId } from '@shared/blocks';
import { icon3dForItem, clearIcon3dCache } from './icons3d';
import { sndSlot, sndOpen, sndClose, sndClick } from './audio';
import { t, blockName, toolName, lang, i18nEvents } from './i18n';

export const uiEvents = new EventTarget();

export type EggAnimal = 'horse' | 'pig' | 'cow' | 'chicken' | 'sheep' | 'zombie' | 'creeper';
export const EGG_ANIMALS: EggAnimal[] = ['horse', 'pig', 'cow', 'chicken', 'sheep', 'zombie', 'creeper'];

export type Item =
  | { kind: 'tool'; id: ToolId }
  | { kind: 'block'; id: number }
  | { kind: 'boat' }
  | { kind: 'igniter' }
  | { kind: 'egg'; id: EggAnimal };

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
    iconCache[k] = icon3dForItem(item);
  }
  return iconCache[k];
}
export function itemName(item: Item): string {
  if (item.kind === 'tool') return toolName(item.id);
  if (item.kind === 'boat') return t('boat');
  if (item.kind === 'igniter') return lang === 'vi' ? IGNITER.name : IGNITER.nameEn;
  if (item.kind === 'egg') return t('egg_' + item.id);
  return blockName(item.id);
}

export type InvTab = 'weapons' | 'tools' | 'animals' | 'natural' | 'building' | 'furniture' | 'vehicles';
let activeTab: InvTab = 'weapons';

const NATURAL_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 39, 40];
const BUILDING_IDS = [21, 22, 23, 24, 42, 43, 44, 45];

const toolItems = (weapon: boolean): Item[] =>
  (Object.keys(TOOLS) as ToolId[]).filter(id => !!TOOLS[id].weapon === weapon).map(id => ({ kind: 'tool' as const, id }));

function entriesForTab(tab: InvTab): Item[] {
  if (tab === 'weapons') return toolItems(true);
  if (tab === 'tools') return toolItems(false);
  if (tab === 'animals') return EGG_ANIMALS.map(id => ({ kind: 'egg' as const, id }));
  if (tab === 'natural') return NATURAL_IDS.filter(id => B[id] && !B[id].noBreak).map(id => ({ kind: 'block' as const, id }));
  if (tab === 'building') return BUILDING_IDS.map(id => ({ kind: 'block' as const, id }));
  if (tab === 'furniture') return FURNITURE_IDS.map(id => ({ kind: 'block' as const, id }));
  return [{ kind: 'boat' }, { kind: 'igniter' }];
}

/** validate item từ localStorage/server (save cũ có thể chứa id không còn tồn tại) */
export function sanitizeItem(it: unknown, fallback: Item): Item {
  const o = it as Item | null;
  if (!o || typeof o !== 'object') return fallback;
  if (o.kind === 'tool') return TOOLS[o.id] ? o : fallback;
  if (o.kind === 'block') return B[o.id] && !B[o.id].noBreak ? o : fallback;
  if (o.kind === 'egg') return EGG_ANIMALS.includes(o.id) ? o : fallback;
  if (o.kind === 'boat' || o.kind === 'igniter') return { kind: o.kind };
  return fallback;
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

export let inventoryOpen = false;
const invEl = document.getElementById('inventory')!;
const invGrid = document.getElementById('invgrid')!;
const invTabsEl = document.getElementById('invtabs')!;

const TAB_IDS: InvTab[] = ['weapons', 'tools', 'animals', 'natural', 'building', 'furniture', 'vehicles'];
const TAB_KEYS: Record<InvTab, string> = {
  weapons: 'tabWeapons', tools: 'tabTools', animals: 'tabAnimals', natural: 'tabNatural',
  building: 'tabBuilding', furniture: 'tabFurniture', vehicles: 'tabVehicles',
};

function renderTabs(): void {
  invTabsEl.innerHTML = '';
  for (const tab of TAB_IDS) {
    const btn = document.createElement('button');
    btn.className = 'invtab' + (tab === activeTab ? ' active' : '');
    btn.textContent = t(TAB_KEYS[tab]);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      activeTab = tab;
      renderTabs();
      renderInventory();
      sndClick();
    });
    invTabsEl.appendChild(btn);
  }
}

export function renderInventory(): void {
  invGrid.innerHTML = '';
  for (const it of entriesForTab(activeTab)) {
    const cell = document.createElement('div');
    cell.className = 'invcell';
    cell.title = itemName(it);
    cell.innerHTML = `<img src="${itemIcon(it)}" alt="${itemName(it)}"><span class="invlabel">${itemName(it)}</span>`;
    cell.addEventListener('click', () => {
      hotbarItems[slot] = it;
      sndClick();
      setSlot(slot, true);
      toggleInventory();
    });
    invGrid.appendChild(cell);
  }
}

// Khởi tạo icon 3D TRƯỚC khi render UI (tránh cache icon 2D cũ)
clearIcon3dCache();
renderHotbar();
renderTabs();
renderInventory();

export function toggleInventory(): void {
  inventoryOpen = !inventoryOpen;
  invEl.style.display = inventoryOpen ? 'block' : 'none';
  if (inventoryOpen) { renderTabs(); renderInventory(); }
  inventoryOpen ? sndOpen() : sndClose();
  uiEvents.dispatchEvent(new Event(inventoryOpen ? 'modalopen' : 'modalclose'));
}

const heartsEl = document.getElementById('hearts')!;
export function updateHearts(hp: number): void {
  const full = Math.ceil(Math.max(hp, 0) / 2);
  let s = '';
  for (let i = 0; i < 10; i++) s += `<span style="color:${i < full ? '#e33' : '#3a3a3a'}">❤</span>`;
  heartsEl.innerHTML = s;
}

const breakbar = document.getElementById('breakbar')!;
const breakFill = breakbar.firstElementChild as HTMLElement;
export function showBreakbar(progress: number): void {
  breakbar.style.display = 'block';
  breakFill.style.width = Math.min(progress * 100, 100) + '%';
}
export function hideBreakbar(): void { breakbar.style.display = 'none'; }

const portalbar = document.getElementById('portalbar')!;
const portalFill = portalbar.firstElementChild as HTMLElement;
export function showPortalBar(progress: number): void {
  portalbar.style.display = 'block';
  portalFill.style.width = Math.min(progress * 100, 100) + '%';
}
export function hidePortalBar(): void { portalbar.style.display = 'none'; }

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

i18nEvents.addEventListener('change', () => { renderTabs(); renderInventory(); renderHotbar(); });
