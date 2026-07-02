// Texture atlas pixel-art vẽ bằng canvas + icon dụng cụ/thuyền
import * as THREE from 'three';
import { rand01 } from '@shared/noise';

export const TILE = 16, NTILES = 46;
export const tileBaseColor: [number, number, number][] = [];

type TileFn = (x: number, y: number, r: number, g: number, b: number, a?: number) => number[] | void;

export const atlasCanvas = document.createElement('canvas');
atlasCanvas.width = TILE * NTILES; atlasCanvas.height = TILE;
const actx = atlasCanvas.getContext('2d')!;

function drawTile(i: number, base: [number, number, number], noiseAmt: number, fn?: TileFn): void {
  tileBaseColor[i] = base;
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    let r: number = base[0], g: number = base[1], b: number = base[2];
    let a: number | undefined;
    const n = (rand01(i * 1000 + y * TILE + x) - 0.5) * 2 * noiseAmt;
    r += n; g += n; b += n;
    if (fn) {
      const o = fn(x, y, r, g, b, a);
      if (o) [r, g, b, a] = o as [number, number, number, number?];
    }
    actx.clearRect(i * TILE + x, y, 1, 1);
    actx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${a === undefined ? 1 : a})`;
    actx.fillRect(i * TILE + x, y, 1, 1);
  }
}
const ore = (color: number[]): TileFn => (x, y) => {
  if (rand01(x * 13.7 + y * 7.3) < 0.16 && x > 0 && y > 0 && x < 15 && y < 15) return color;
};

// ===== tự nhiên (0-23) =====
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

// ===== hiện đại + nội thất (24-44) =====
drawTile(24, [243, 243, 240], 5);                                  // bê tông trắng
drawTile(25, [130, 132, 136], 6);                                  // bê tông xám
drawTile(26, [40, 40, 46], 5);                                     // bê tông đen
drawTile(27, [206, 172, 122], 6, (x, y, r, g, b) => {              // sàn gỗ sáng
  if (x % 8 === 7 || y % 4 === 3) return [r - 34, g - 28, b - 20];
});
drawTile(28, [171, 137, 84], 5, (x, y) => {                        // kệ sách: các gáy sách màu
  if (y < 2 || (y > 6 && y < 9) || y > 13) return undefined;       // khung gỗ
  const shelf = y < 7 ? 0 : 1;
  const col = (x / 2 | 0) + shelf * 8;
  const palette = [[180, 60, 60], [60, 110, 180], [70, 160, 80], [200, 170, 60], [150, 80, 160], [200, 120, 60], [90, 90, 150], [170, 90, 90]];
  const c = palette[col % 8];
  return [c[0] + (rand01(col * 31) - 0.5) * 20, c[1], c[2]];
});
drawTile(29, [206, 172, 122], 6, (x, y, r, g, b) => {              // bàn: mặt trên + chân
  if (y < 3) return [r - 20, g - 16, b - 12];
  if ((x < 3 || x > 12) && y >= 3) return [140, 110, 70];
  return [r, g, b, 0];
});
drawTile(30, [196, 160, 110], 6, (x, y, r, g, b) => {              // ghế: nan dọc
  if (x % 4 === 3) return [r - 36, g - 30, b - 22];
  if (y % 6 === 5) return [r - 24, g - 20, b - 14];
});
drawTile(31, [190, 50, 50], 8, (x, y) => {                         // giường mặt trên: gối trắng
  if (y < 5) return [240, 240, 245];
  if (y === 5) return [150, 35, 35];
});
drawTile(32, [190, 50, 50], 8, (x, y, r, g, b) => {                // giường cạnh
  if (y > 11) return [140, 110, 70];
  if (y < 3) return [230, 230, 235];
});
drawTile(33, [70, 105, 165], 10, (x, y, r, g, b) => {              // sofa xanh: đường may
  if (x % 8 === 0 || y % 8 === 7) return [r - 26, g - 26, b - 30];
});
drawTile(34, [235, 238, 240], 4, (x, y, r, g, b) => {              // tủ lạnh: tay nắm + ngăn
  if (x === 3 && y > 2 && y < 13) return [120, 124, 130];
  if (y === 7) return [200, 204, 208];
});
drawTile(35, [50, 52, 56], 6, (x, y) => {                          // mặt bếp: 4 vòng lửa
  for (const [cx, cy] of [[4, 4], [11, 4], [4, 11], [11, 11]]) {
    const d = Math.hypot(x - cx, y - cy);
    if (d > 1.2 && d < 2.6) return [160, 160, 165];
  }
});
drawTile(36, [120, 124, 130], 6, (x, y) => {                       // thân bếp: cửa kính lò
  if (x > 2 && x < 13 && y > 6 && y < 13) return [35, 30, 30];
  if (y < 3) return [80, 84, 90];
});
drawTile(37, [25, 25, 30], 4, (x, y) => {                          // TV: màn hình sáng giữa
  if (x > 1 && x < 14 && y > 1 && y < 12) {
    const n = rand01(x * 7 + y * 13);
    return n < 0.5 ? [40, 80, 140] : [60, 110, 170];
  }
  if (y >= 13 && x > 5 && x < 10) return [70, 70, 75];
});
drawTile(38, [255, 225, 150], 10, (x, y, r, g, b) => {             // đèn bàn: chụp đèn
  if (y > 10) return [120, 95, 60];
  if (y < 2 || x < 2 || x > 13) return [235, 190, 110];
});
drawTile(39, [165, 45, 45], 12, (x, y, r, g, b) => {               // thảm đỏ: viền hoạ tiết
  if (x < 2 || x > 13 || y < 2 || y > 13) return [205, 170, 90];
});
drawTile(40, [120, 90, 55], 5, (x, y) => {                         // tranh: phong cảnh
  if (x > 2 && x < 13 && y > 2 && y < 13) {
    if (y < 7) return [120, 170, 220];
    if (y === 7 && x > 6 && x < 10) return [240, 220, 130];
    return [80, 140, 70];
  }
});
drawTile(41, [160, 90, 60], 10, (x, y, r, g, b) => {               // chậu hoa: gốm đất nung
  if (y < 4) return [70, 150, 60];
  if (y === 4) return [r - 30, g - 24, b - 18];
});
drawTile(42, [196, 160, 110], 6, (x, y, r, g, b) => {              // tủ bếp: hai cánh + tay nắm
  if (x === 7 || x === 8) return [r - 36, g - 30, b - 22];
  if ((x === 5 || x === 10) && y > 6 && y < 10) return [90, 92, 98];
  if (y < 2) return [r - 22, g - 18, b - 14];
});
drawTile(43, [171, 137, 84], 7, (x, y, r, g, b) => {               // hàng rào: thanh dọc + lỗ
  if (y > 2 && y < 7 && !(x % 5 < 2)) return [r, g, b, 0];
  if (y > 9 && y < 14 && !(x % 5 < 2)) return [r, g, b, 0];
});
drawTile(44, [110, 78, 50], 10, (x, y) => {                        // mặt chậu hoa: đất + hoa
  const d = Math.hypot(x - 7.5, y - 7.5);
  if (d < 2) return [230, 90, 120];
  if (d < 3.4) return [70, 150, 60];
});

drawTile(45, [225, 90, 20], 20, (x, y, r, g, b) => {              // dung nham: vệt sáng chảy
  const n = rand01((x / 3 | 0) * 23 + (y / 3 | 0) * 71);
  if (n < 0.22) return [255, 210, 80];
  if (n > 0.85) return [150, 35, 10];
  return [r, g, b];
});

export const atlasTex = new THREE.CanvasTexture(atlasCanvas);
atlasTex.magFilter = THREE.NearestFilter;
atlasTex.minFilter = THREE.NearestFilter;
atlasTex.colorSpace = THREE.SRGBColorSpace;

export function tileToDataURL(tileIdx: number): string {
  const c = document.createElement('canvas');
  c.width = TILE; c.height = TILE;
  c.getContext('2d')!.drawImage(atlasCanvas, tileIdx * TILE, 0, TILE, TILE, 0, 0, TILE, TILE);
  return c.toDataURL();
}

export function drawToolIcon(kind: string): string {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const g = c.getContext('2d')!;
  const px = (x: number, y: number, col: string) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
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
  } else if (kind === 'boat') {
    for (let x = 2; x < 14; x++) px(x, 10, wood);
    for (let x = 3; x < 13; x++) { px(x, 11, '#6e4f2b'); px(x, 9, wood); }
    px(2, 9, wood); px(13, 9, wood); px(2, 8, wood); px(13, 8, wood);
    for (let i = 0; i < 5; i++) px(8 + i, 3 + i, '#a8804f'); // mái chèo
  }
  return c.toDataURL();
}
