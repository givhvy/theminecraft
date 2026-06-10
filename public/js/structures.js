// Bản thiết kế các công trình cho AI Builder
// Mỗi công trình trả về danh sách [x, y, z, blockId] với toạ độ cục bộ:
//   x: trái/phải (âm = trái), y: cao (0 = nền), z: sâu (0 = gần người chơi, tăng dần ra xa)
import {
  AIR, GRASS, DIRT, STONE, LOG, LEAVES, SAND, PLANKS, GLASS, WATER,
  COBBLE, BRICKS, SNOW, COAL, IRON, GOLD, DIAMOND, OBSIDIAN, GLOW, TNT,
} from './blocks.js';

// ---- tiện ích ----
function fillBox(out, x1, y1, z1, x2, y2, z2, id) {
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++)
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++)
      for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z++)
        out.push([x, y, z, id]);
}
function hollowBox(out, x1, y1, z1, x2, y2, z2, id) {
  for (let x = x1; x <= x2; x++) for (let y = y1; y <= y2; y++) for (let z = z1; z <= z2; z++) {
    if (x === x1 || x === x2 || y === y1 || y === y2 || z === z1 || z === z2) out.push([x, y, z, id]);
  }
}
function walls(out, x1, y1, z1, x2, y2, z2, id) {
  for (let x = x1; x <= x2; x++) for (let y = y1; y <= y2; y++) for (let z = z1; z <= z2; z++) {
    if (x === x1 || x === x2 || z === z1 || z === z2) out.push([x, y, z, id]);
  }
}

// ---- 🏠 Nhà gỗ ----
function house() {
  const o = [];
  const W = 4, D = 9; // nửa rộng, sâu
  fillBox(o, -W, 0, 0, W, 0, D, PLANKS);                  // sàn
  walls(o, -W, 1, 0, W, 4, D, PLANKS);                    // tường
  for (const [x, z] of [[-W, 0], [W, 0], [-W, D], [W, D]])
    fillBox(o, x, 1, z, x, 4, z, LOG);                    // cột góc
  // cửa ra vào (hướng về người chơi)
  fillBox(o, 0, 1, 0, 0, 2, 0, AIR);
  // cửa sổ
  for (const z of [3, 6]) {
    o.push([-W, 2, z, GLASS], [-W, 3, z, GLASS], [W, 2, z, GLASS], [W, 3, z, GLASS]);
  }
  o.push([2, 2, 0, GLASS], [2, 3, 0, GLASS], [-2, 2, 0, GLASS], [-2, 3, 0, GLASS]);
  // mái dốc bằng ván
  for (let i = 0; i <= W + 1; i++) {
    fillBox(o, -W - 1 + i, 4 + i, -1, -W - 1 + i, 4 + i, D + 1, PLANKS);
    fillBox(o, W + 1 - i, 4 + i, -1, W + 1 - i, 4 + i, D + 1, PLANKS);
    if (W + 1 - i <= -W - 1 + i) break;
  }
  // đèn trong nhà
  o.push([0, 4, 3, GLOW], [0, 4, 6, GLOW]);
  return o;
}

// ---- 🏰 Lâu đài ----
function castle() {
  const o = [];
  const R = 12, H = 6; // nửa cạnh, cao tường
  fillBox(o, -R, 0, 0, R, 0, R * 2, COBBLE);              // nền
  walls(o, -R, 1, 0, R, H, R * 2, COBBLE);                // tường ngoài
  // lỗ châu mai trên tường
  for (let x = -R; x <= R; x += 2) {
    o.push([x, H + 1, 0, COBBLE], [x, H + 1, R * 2, COBBLE]);
  }
  for (let z = 0; z <= R * 2; z += 2) {
    o.push([-R, H + 1, z, COBBLE], [R, H + 1, z, COBBLE]);
  }
  // 4 tháp góc
  for (const [tx, tz] of [[-R, 0], [R, 0], [-R, R * 2], [R, R * 2]]) {
    walls(o, tx - 2, 1, tz - 2, tx + 2, H + 4, tz + 2, COBBLE);
    fillBox(o, tx - 2, H + 4, tz - 2, tx + 2, H + 4, tz + 2, COBBLE);
    for (let x = tx - 2; x <= tx + 2; x += 2) for (let z = tz - 2; z <= tz + 2; z += 2)
      o.push([x, H + 5, z, COBBLE]);
    o.push([tx, H + 5, tz, GLOW]);
  }
  // cổng chính
  fillBox(o, -2, 1, 0, 2, 4, 0, AIR);
  fillBox(o, -3, 1, 0, -3, 5, 0, BRICKS);
  fillBox(o, 3, 1, 0, 3, 5, 0, BRICKS);
  fillBox(o, -3, 5, 0, 3, 5, 0, BRICKS);
  // lối đi vào sảnh chính
  fillBox(o, -1, 0, 0, 1, 0, R * 2 - 4, BRICKS);
  // sảnh chính giữa (keep)
  const K = 5;
  walls(o, -K, 1, R - K + R / 2, K, H + 3, R + K + R / 2, BRICKS);
  fillBox(o, -K, H + 4, R - K + R / 2, K, H + 4, R + K + R / 2, BRICKS);
  fillBox(o, 0, 1, R - K + R / 2, 0, 3, R - K + R / 2, AIR); // cửa keep
  for (const y of [3, 4]) for (const x of [-3, 3]) {
    o.push([x, y, R - K + R / 2, GLASS]);
  }
  o.push([0, H + 5, R + R / 2, GLOW]);
  // đuốc sân
  for (const [x, z] of [[-6, 6], [6, 6], [-6, R + 4], [6, R + 4]]) {
    fillBox(o, x, 1, z, x, 2, z, LOG);
    o.push([x, 3, z, GLOW]);
  }
  return o;
}

// ---- 🐉 Hầm ngục rồng ----
function dragonDungeon() {
  const o = [];
  const W = 7, D = 28, H = 8;
  fillBox(o, -W, 0, 0, W, 0, D, COBBLE);                  // sàn
  walls(o, -W, 1, 0, W, H - 1, D, BRICKS);                // tường
  fillBox(o, -W, H, 0, W, H, D, BRICKS);                  // trần
  fillBox(o, -1, 1, 0, 1, 3, 0, AIR);                     // cổng vào
  // hàng cột + đèn
  for (let z = 4; z <= D - 8; z += 4) {
    for (const x of [-W + 2, W - 2]) {
      fillBox(o, x, 1, z, x, H - 1, z, COBBLE);
      o.push([x, 4, z + 1, GLOW]);
    }
  }
  // bệ obsidian cuối hầm
  fillBox(o, -5, 1, D - 7, 5, 1, D - 1, OBSIDIAN);
  // kho báu
  for (const [x, z, id] of [[-3, D - 3, GOLD], [-2, D - 2, GOLD], [3, D - 3, DIAMOND], [2, D - 2, DIAMOND], [0, D - 2, GOLD]]) {
    o.push([x, 2, z, id]);
  }
  // === TƯỢNG RỒNG ===
  const dz = D - 5; // tâm tượng
  // thân
  fillBox(o, -1, 2, dz - 2, 1, 3, dz + 2, OBSIDIAN);
  fillBox(o, -1, 4, dz - 1, 1, 4, dz + 1, OBSIDIAN);
  // cổ + đầu (vươn về phía cổng)
  fillBox(o, 0, 4, dz - 3, 0, 5, dz - 3, OBSIDIAN);
  fillBox(o, -1, 6, dz - 5, 1, 6, dz - 4, OBSIDIAN);
  fillBox(o, -1, 7, dz - 5, 1, 7, dz - 5, OBSIDIAN);
  // mắt phát sáng
  o.push([-1, 7, dz - 6, GLOW], [1, 7, dz - 6, GLOW]);
  // hàm
  fillBox(o, 0, 6, dz - 6, 0, 6, dz - 7, OBSIDIAN);
  // cánh trái/phải
  for (let i = 0; i < 4; i++) {
    o.push([-2 - i, 4 + i, dz, OBSIDIAN], [-2 - i, 4 + i, dz + 1, OBSIDIAN]);
    o.push([2 + i, 4 + i, dz, OBSIDIAN], [2 + i, 4 + i, dz + 1, OBSIDIAN]);
  }
  // đuôi
  fillBox(o, 0, 2, dz + 3, 0, 3, dz + 4, OBSIDIAN);
  o.push([0, 2, dz + 5, OBSIDIAN]);
  // đèn quanh bệ
  for (const x of [-4, 4]) for (const z of [dz - 2, dz + 2]) o.push([x, 2, z, GLOW]);
  return o;
}

// ---- 🗼 Tháp phù thủy ----
function wizardTower() {
  const o = [];
  const H = 16, R = 4;
  const inside = (x, z, r) => x * x + z * z <= r * r + 1;
  for (let y = 0; y <= H; y++) for (let x = -R; x <= R; x++) for (let z = -R; z <= R; z++) {
    const isWall = inside(x, z, R) && !inside(x, z, R - 1);
    if (y === 0 && inside(x, z, R)) o.push([x, 0, z + R, BRICKS]);
    else if (isWall && y <= H - 4) {
      // cửa sổ xoắn ốc
      const ang = Math.atan2(z, x);
      const winY = ((ang + Math.PI) / (Math.PI * 2) * 12 + 2) | 0;
      o.push([x, y, z + R, (y === winY || y === winY + 1) && y > 1 ? GLASS : BRICKS]);
    }
  }
  fillBox(o, 0, 1, R, 0, 2, R, AIR); // cửa: khoét lỗ phía gần
  o.push([0, 3, R, GLOW]);
  // sàn đỉnh rộng hơn
  for (let x = -R - 1; x <= R + 1; x++) for (let z = -R - 1; z <= R + 1; z++) {
    if (inside(x, z, R + 1)) o.push([x, H - 3, z + R, PLANKS]);
  }
  // vòm kính trên đỉnh
  for (let x = -R; x <= R; x++) for (let z = -R; z <= R; z++) {
    if (inside(x, z, R) && !inside(x, z, R - 1)) {
      o.push([x, H - 2, z + R, GLASS], [x, H - 1, z + R, GLASS]);
    }
    if (inside(x, z, R - 1)) o.push([x, H, z + R, GLASS]);
  }
  o.push([0, H - 2, R, GLOW]); // ngọn đèn ma thuật
  return o;
}

// ---- 🔺 Kim tự tháp ----
function pyramid() {
  const o = [];
  const R = 10;
  for (let y = 0; y <= R; y++) {
    const r = R - y;
    for (let x = -r; x <= r; x++) for (let z = -r; z <= r; z++) {
      const edge = Math.abs(x) === r || Math.abs(z) === r;
      if (edge || y === 0) o.push([x, y, z + R, SAND]);
    }
  }
  // phòng kho báu bên trong
  fillBox(o, -3, 1, R - 3, 3, 4, R + 3, AIR);
  fillBox(o, -1, 1, 1, 1, 2, R - 3, AIR); // hành lang vào
  fillBox(o, 0, 1, 0, 0, 2, 1, AIR);      // cửa
  o.push([0, 4, R, GLOW]);
  for (const [x, z, id] of [[-2, R, GOLD], [2, R, GOLD], [0, R + 2, DIAMOND], [-2, R + 2, GOLD], [2, R - 2, IRON]]) {
    o.push([x, 1, z, id]);
  }
  return o;
}

// ---- 🌉 Cầu đá ----
function bridge() {
  const o = [];
  const L = 30, W = 2;
  fillBox(o, -W, 0, 0, W, 0, L, BRICKS);          // mặt cầu
  for (let z = 0; z <= L; z++) {                   // lan can
    o.push([-W, 1, z, COBBLE], [W, 1, z, COBBLE]);
  }
  for (let z = 0; z <= L; z += 6) {                // trụ đèn
    o.push([-W, 2, z, COBBLE], [W, 2, z, COBBLE]);
    o.push([-W, 3, z, GLOW], [W, 3, z, GLOW]);
    // chân cầu chống xuống đất
    fillBox(o, -W, -8, z, -W, -1, z, COBBLE);
    fillBox(o, W, -8, z, W, -1, z, COBBLE);
  }
  return o;
}

// ---- 🗼 Hải đăng ----
function lighthouse() {
  const o = [];
  const H = 18, R = 3;
  const inside = (x, z, r) => x * x + z * z <= r * r + 0.5;
  for (let y = 0; y <= H; y++) for (let x = -R; x <= R; x++) for (let z = -R; z <= R; z++) {
    if (inside(x, z, R) && !inside(x, z, R - 1)) {
      // sọc đỏ trắng xen kẽ
      o.push([x, y, z + R, (y / 3 | 0) % 2 === 0 ? BRICKS : SNOW]);
    }
    if (y === 0 && inside(x, z, R)) o.push([x, 0, z + R, COBBLE]);
  }
  fillBox(o, 0, 1, R, 0, 2, R, AIR); // cửa: khoét phía gần
  // buồng đèn
  fillBox(o, -2, H + 1, R - 2, 2, H + 1, R + 2, COBBLE);
  for (const [x, z] of [[-2, R - 2], [2, R - 2], [-2, R + 2], [2, R + 2]]) {
    fillBox(o, x, H + 2, z, x, H + 3, z, COBBLE);
  }
  fillBox(o, -1, H + 2, R - 1, 1, H + 3, R + 1, GLOW); // đèn lớn
  fillBox(o, -2, H + 4, R - 2, 2, H + 4, R + 2, COBBLE);
  return o;
}

// ---- 🐲 Tượng rồng (ngoài trời, to hơn) ----
function dragonStatue() {
  const o = [];
  // bệ
  fillBox(o, -4, 0, 0, 4, 0, 12, COBBLE);
  fillBox(o, -3, 1, 1, 3, 1, 11, OBSIDIAN);
  // thân
  fillBox(o, -2, 2, 4, 2, 4, 9, OBSIDIAN);
  fillBox(o, -1, 5, 5, 1, 5, 8, OBSIDIAN);
  // cổ + đầu vươn cao về phía trước
  fillBox(o, 0, 5, 3, 0, 7, 4, OBSIDIAN);
  fillBox(o, -1, 8, 1, 1, 9, 3, OBSIDIAN);
  o.push([-1, 9, 0, GLOW], [1, 9, 0, GLOW]);     // mắt
  fillBox(o, 0, 8, 0, 0, 8, -1, OBSIDIAN);        // mõm
  // cánh xoè hai bên
  for (let i = 0; i < 6; i++) {
    fillBox(o, -3 - i, 4 + i, 6, -3 - i, 5 + i, 8, OBSIDIAN);
    fillBox(o, 3 + i, 4 + i, 6, 3 + i, 5 + i, 8, OBSIDIAN);
  }
  // đuôi cong lên
  fillBox(o, 0, 2, 10, 0, 4, 11, OBSIDIAN);
  o.push([0, 5, 12, OBSIDIAN], [0, 6, 12, OBSIDIAN]);
  // lửa quanh bệ
  for (const [x, z] of [[-3, 1], [3, 1], [-3, 11], [3, 11]]) o.push([x, 2, z, GLOW]);
  return o;
}

export const STRUCTURES = [
  { id: 'house',      emoji: '🏠', name: 'Nhà gỗ',         desc: 'Nhà ván gỗ ấm cúng có cửa sổ kính và đèn', gen: house },
  { id: 'castle',     emoji: '🏰', name: 'Lâu đài',        desc: 'Tường thành, 4 tháp canh, cổng và sảnh chính', gen: castle },
  { id: 'dungeon',    emoji: '🐉', name: 'Hầm ngục rồng',  desc: 'Đại sảnh tối tăm, kho báu và tượng rồng obsidian', gen: dragonDungeon },
  { id: 'tower',      emoji: '🧙', name: 'Tháp phù thủy',  desc: 'Tháp gạch cao với cửa sổ xoắn ốc và vòm kính', gen: wizardTower },
  { id: 'pyramid',    emoji: '🔺', name: 'Kim tự tháp',    desc: 'Kim tự tháp cát ẩn giấu phòng kho báu', gen: pyramid },
  { id: 'bridge',     emoji: '🌉', name: 'Cầu đá',         desc: 'Cầu gạch dài 30 block có trụ đèn', gen: bridge },
  { id: 'lighthouse', emoji: '🗼', name: 'Hải đăng',       desc: 'Tháp sọc đỏ trắng với đèn biển rực sáng', gen: lighthouse },
  { id: 'dragon',     emoji: '🐲', name: 'Tượng rồng',     desc: 'Rồng obsidian khổng lồ xoè cánh, mắt phát sáng', gen: dragonStatue },
];
