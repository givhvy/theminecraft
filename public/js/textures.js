// Texture atlas pixel-art vẽ bằng canvas + icon dụng cụ
import * as THREE from 'three';
import { B } from './blocks.js';
import { rand01 } from './noise.js';

export const TILE = 16, NTILES = 24;
export const tileBaseColor = [];

export const atlasCanvas = document.createElement('canvas');
atlasCanvas.width = TILE * NTILES; atlasCanvas.height = TILE;
const actx = atlasCanvas.getContext('2d');

function drawTile(i, base, noiseAmt, fn) {
  tileBaseColor[i] = base;
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    let [r, g, b, a] = base;
    const n = (rand01(i * 1000 + y * TILE + x) - 0.5) * 2 * noiseAmt;
    r += n; g += n; b += n;
    if (fn) { const o = fn(x, y, r, g, b, a); if (o) [r, g, b, a] = o; }
    actx.clearRect(i * TILE + x, y, 1, 1);
    actx.fillStyle = `rgba(${r|0},${g|0},${b|0},${a === undefined ? 1 : a})`;
    actx.fillRect(i * TILE + x, y, 1, 1);
  }
}
const ore = (color) => (x, y) => {
  if (rand01(x * 13.7 + y * 7.3) < 0.16 && x > 0 && y > 0 && x < 15 && y < 15) return color;
};

// 0 cỏ-trên  1 cỏ-cạnh  2 đất  3 đá  4 gỗ-cạnh  5 gỗ-trên  6 lá  7 cát
drawTile(0, [106, 170, 64], 14);
drawTile(1, [134, 96, 67], 10, (x, y) => {
  if (y < 3 + (rand01(x * 7 + 2) * 2 | 0)) { const n = (rand01(x * 31 + y) - 0.5) * 24; return [106 + n, 170 + n, 64 + n]; }
});
drawTile(2, [134, 96, 67], 14);
drawTile(3, [127, 127, 127], 12);
drawTile(4, [102, 81, 50], 8, (x, y, r, g, b) => { if (x % 4 === 0) return [r - 22, g - 18, b - 12]; });
drawTile(5, [177, 144, 86], 8, (x, y, r, g, b) => {
  const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
  if ((d | 0) % 2 === 0) return [r - 26, g - 22, b - 14];
});
drawTile(6, [60, 130, 40], 22, (x, y, r, g, b) => { if (rand01(x * 53 + y * 9) < 0.12) return [r, g, b, 0]; });
drawTile(7, [219, 207, 163], 10);
// 8 ván  9 kính  10 đá cuội  11 gạch  12 tuyết-trên  13 tuyết-cạnh  14 bedrock
drawTile(8, [171, 137, 84], 7, (x, y, r, g, b) => { if (y % 4 === 3) return [r - 30, g - 26, b - 18]; });
drawTile(9, [200, 230, 240], 0, (x, y, r, g, b) => {
  if (x === 0 || y === 0 || x === TILE - 1 || y === TILE - 1) return [230, 245, 250, 1];
  if ((x + y) % 7 === 0 && x > 2 && y < 12) return [255, 255, 255, 0.55];
  return [r, g, b, 0.12];
});
drawTile(10, [110, 110, 112], 16, (x, y, r, g, b) => {
  const n = (rand01((x / 5 | 0) * 17 + (y / 5 | 0) * 5) - 0.5) * 40;
  return [r + n, g + n, b + n];
});
drawTile(11, [150, 70, 58], 9, (x, y) => {
  const row = y / 4 | 0;
  if (y % 4 === 3 || (x + (row % 2) * 4 + 2) % 8 === 7) return [200, 195, 188];
});
drawTile(12, [235, 240, 248], 8);
drawTile(13, [134, 96, 67], 10, (x, y) => {
  if (y < 4 + (rand01(x * 3 + 9) * 2 | 0)) { const n = (rand01(x * 11 + y) - 0.5) * 16; return [235 + n, 240 + n, 248 + n]; }
});
drawTile(14, [55, 55, 58], 26);
// 15-18 quặng  19 obsidian  20 đá sáng  21 TNT cạnh  22 TNT trên  23 nước
drawTile(15, [127, 127, 127], 12, ore([35, 35, 38]));
drawTile(16, [127, 127, 127], 12, ore([216, 175, 147]));
drawTile(17, [127, 127, 127], 12, ore([250, 215, 70]));
drawTile(18, [127, 127, 127], 12, ore([95, 230, 230]));
drawTile(19, [28, 22, 40], 10, (x, y) => { if (rand01(x * 29 + y * 3) < 0.07) return [90, 60, 140]; });
drawTile(20, [255, 200, 90], 18, (x, y) => { if (rand01(x * 9 + y * 21) < 0.2) return [255, 240, 170]; });
drawTile(21, [190, 60, 50], 10, (x, y) => {
  if (y >= 6 && y <= 9) return x % 4 < 2 ? [240, 235, 225] : [40, 40, 40];
  if (y < 2 || y > 13) return [120, 35, 30];
});
drawTile(22, [190, 60, 50], 10, (x, y) => {
  if (Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)) < 3) return [60, 50, 45];
});
drawTile(23, [50, 105, 200], 12, (x, y) => {
  if (rand01(x * 3 + y * 19) < 0.1) return [110, 160, 235];
});

export const atlasTex = new THREE.CanvasTexture(atlasCanvas);
atlasTex.magFilter = THREE.NearestFilter;
atlasTex.minFilter = THREE.NearestFilter;
atlasTex.colorSpace = THREE.SRGBColorSpace;

export function tileToDataURL(tileIdx) {
  const c = document.createElement('canvas');
  c.width = TILE; c.height = TILE;
  c.getContext('2d').drawImage(atlasCanvas, tileIdx * TILE, 0, TILE, TILE, 0, 0, TILE, TILE);
  return c.toDataURL();
}

export function drawToolIcon(kind) {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const g = c.getContext('2d');
  const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  const steel = '#cfd6dd', steelD = '#8d979f', wood = '#8a6336';
  if (kind === 'sword') {
    for (let i = 0; i < 8; i++) { px(11 - i, 3 + i, steel); px(12 - i, 3 + i, steelD); }
    px(4, 11, '#555'); px(5, 10, '#555'); px(3, 12, wood); px(2, 13, wood);
  } else if (kind === 'pickaxe') {
    for (let i = 0; i < 8; i++) px(4 + i, 12 - i, wood);
    for (let i = 0; i < 7; i++) { px(5 + i, 3, steel); px(3, 5 + i, steel); }
    px(4, 4, steel); px(11, 4, steelD); px(4, 11, steelD);
  } else if (kind === 'axe') {
    for (let i = 0; i < 9; i++) px(4 + i, 12 - i, wood);
    for (let y = 2; y < 7; y++) for (let x = 8; x < 13; x++) if (x + y < 17) px(x, y, (x + y) % 2 ? steel : steelD);
  } else if (kind === 'shovel') {
    for (let i = 0; i < 8; i++) px(5 + i, 12 - i, wood);
    for (let y = 2; y < 6; y++) for (let x = 10; x < 14; x++) px(x, y, (x + y) % 2 ? steel : steelD);
  }
  return c.toDataURL();
}
