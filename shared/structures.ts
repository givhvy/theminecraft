// Bản thiết kế các công trình cho AI Builder
// Toạ độ cục bộ: x trái/phải, y cao (0 = nền), z sâu (0 = gần người chơi)
import {
  AIR, SAND, PLANKS, GLASS, WATER, LOG, COBBLE, BRICKS, SNOW,
  IRON, GOLD, DIAMOND, OBSIDIAN, GLOW,
  CONCRETE_W, CONCRETE_G, CONCRETE_B, WOOD_FLOOR, BOOKSHELF, TABLE, CHAIR,
  BED, SOFA, FRIDGE, STOVE, TV, LAMP, CARPET, PAINTING, POT, CABINET, FENCE,
} from './blocks.js';

export type BlockPlacement = [x: number, y: number, z: number, id: number];
export interface Structure {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  gen: () => BlockPlacement[];
}

function fillBox(out: BlockPlacement[], x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, id: number): void {
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++)
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++)
      for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z++)
        out.push([x, y, z, id]);
}
function walls(out: BlockPlacement[], x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, id: number): void {
  for (let x = x1; x <= x2; x++) for (let y = y1; y <= y2; y++) for (let z = z1; z <= z2; z++) {
    if (x === x1 || x === x2 || z === z1 || z === z2) out.push([x, y, z, id]);
  }
}

// ---- 🏠 Nhà gỗ ----
function house(): BlockPlacement[] {
  const o: BlockPlacement[] = [];
  const W = 4, D = 9;
  fillBox(o, -W, 0, 0, W, 0, D, PLANKS);
  walls(o, -W, 1, 0, W, 4, D, PLANKS);
  for (const [x, z] of [[-W, 0], [W, 0], [-W, D], [W, D]]) fillBox(o, x, 1, z, x, 4, z, LOG);
  fillBox(o, 0, 1, 0, 0, 2, 0, AIR);
  for (const z of [3, 6]) o.push([-W, 2, z, GLASS], [-W, 3, z, GLASS], [W, 2, z, GLASS], [W, 3, z, GLASS]);
  o.push([2, 2, 0, GLASS], [2, 3, 0, GLASS], [-2, 2, 0, GLASS], [-2, 3, 0, GLASS]);
  for (let i = 0; i <= W + 1; i++) {
    fillBox(o, -W - 1 + i, 4 + i, -1, -W - 1 + i, 4 + i, D + 1, PLANKS);
    fillBox(o, W + 1 - i, 4 + i, -1, W + 1 - i, 4 + i, D + 1, PLANKS);
    if (W + 1 - i <= -W - 1 + i) break;
  }
  // nội thất
  o.push([0, 4, 3, GLOW], [0, 4, 6, GLOW]);
  o.push([-3, 1, 8, BED], [-2, 1, 8, BED]);
  o.push([3, 1, 8, BOOKSHELF], [3, 2, 8, BOOKSHELF]);
  o.push([-3, 1, 4, TABLE], [-3, 1, 3, CHAIR], [-3, 1, 5, CHAIR]);
  o.push([3, 1, 2, POT], [0, 1, 5, CARPET]);
  o.push([3, 2, 5, PAINTING]);
  return o;
}

// ---- 🏡 Nhà hiện đại ----
function modernHouse(): BlockPlacement[] {
  const o: BlockPlacement[] = [];
  const W = 7, D = 12; // nửa rộng 7 (rộng 15), sâu 12

  // ===== TẦNG 1 =====
  fillBox(o, -W, 0, 0, W, 0, D, WOOD_FLOOR);                 // sàn gỗ
  // tường sau + hai bên: bê tông trắng
  fillBox(o, -W, 1, D, W, 3, D, CONCRETE_W);
  fillBox(o, -W, 1, 0, -W, 3, D, CONCRETE_W);
  fillBox(o, W, 1, 0, W, 3, D, CONCRETE_W);
  // mặt tiền kính lớn + khung bê tông đen
  fillBox(o, -W, 1, 0, W, 3, 0, GLASS);
  fillBox(o, -W, 1, 0, -W + 1, 3, 0, CONCRETE_B);
  fillBox(o, W - 1, 1, 0, W, 3, 0, CONCRETE_B);
  fillBox(o, -1, 1, 0, 1, 3, 0, AIR);                        // cửa vào
  // cửa sổ ngang bên hông
  fillBox(o, -W, 2, 3, -W, 2, 9, GLASS);
  fillBox(o, W, 2, 3, W, 2, 9, GLASS);
  // trần tầng 1 / sàn tầng 2
  fillBox(o, -W, 4, 0, W, 4, D, CONCRETE_G);

  // --- phòng khách (trái) ---
  fillBox(o, -5, 1, 2, -2, 1, 4, CARPET);
  o.push([-5, 1, 5, SOFA], [-4, 1, 5, SOFA], [-3, 1, 5, SOFA]);
  o.push([-4, 1, 1, TV], [-5, 1, 1, CABINET], [-3, 1, 1, CABINET]);
  o.push([-6, 1, 5, POT], [-6, 2, 8, PAINTING]);
  o.push([-1, 1, 6, LAMP]);
  // --- bếp (phải, sát tường sau) ---
  fillBox(o, 2, 1, D - 1, 6, 1, D - 1, CABINET);
  o.push([6, 1, D - 2, FRIDGE], [6, 2, D - 2, FRIDGE]);
  o.push([4, 1, D - 1, STOVE]);
  o.push([3, 1, D - 4, TABLE], [4, 1, D - 4, TABLE]);
  o.push([3, 1, D - 5, CHAIR], [4, 1, D - 5, CHAIR], [3, 1, D - 3, CHAIR], [4, 1, D - 3, CHAIR]);
  // đèn trần tầng 1
  o.push([-3, 4, 3, LAMP], [3, 4, 3, LAMP], [0, 4, 8, LAMP]);
  // cầu thang gỗ lên tầng 2
  for (let i = 0; i < 4; i++) fillBox(o, 0, 1, 3 + i, 0, 1 + i, 3 + i, WOOD_FLOOR);
  fillBox(o, 0, 4, 3, 0, 4, 6, AIR); // lỗ thông tầng cho cầu thang
  fillBox(o, 0, 4, 6, 0, 4, 6, AIR);

  // ===== TẦNG 2 (lùi vào, có sân thượng phía trước) =====
  const D2 = 4; // tầng 2 bắt đầu từ z=4
  fillBox(o, -W, 5, D2, W, 7, D, CONCRETE_W);   // khối đặc tạm
  fillBox(o, -W + 1, 5, D2 + 1, W - 1, 7, D - 1, AIR); // khoét rỗng bên trong
  // mặt tiền tầng 2 = kính
  fillBox(o, -W + 1, 5, D2, W - 1, 7, D2, GLASS);
  fillBox(o, 0, 5, D2, 0, 6, D2, AIR);          // cửa ra sân thượng
  // cửa sổ ngang tầng 2
  fillBox(o, -W, 6, 6, -W, 6, 10, GLASS);
  fillBox(o, W, 6, 6, W, 6, 10, GLASS);
  // mái phẳng nhô ra
  fillBox(o, -W - 1, 8, D2 - 1, W + 1, 8, D + 1, CONCRETE_B);
  // --- phòng ngủ ---
  o.push([-5, 5, D - 2, BED], [-5, 5, D - 3, BED]);
  o.push([-6, 5, D - 1, LAMP], [-3, 5, D - 1, CABINET]);
  fillBox(o, 4, 5, D - 1, 6, 6, D - 1, BOOKSHELF);
  o.push([5, 5, D - 3, TABLE], [5, 5, D - 4, CHAIR]);
  fillBox(o, -2, 5, 7, 2, 5, 9, CARPET);
  o.push([0, 7, 8, LAMP], [-6, 6, 7, PAINTING]);
  // --- sân thượng (trên trần tầng 1, phía trước tầng 2) ---
  for (let x = -W; x <= W; x++) o.push([x, 5, 0, FENCE]);
  fillBox(o, -W, 5, 0, -W, 5, D2 - 1, FENCE);
  fillBox(o, W, 5, 0, W, 5, D2 - 1, FENCE);
  o.push([-5, 5, 2, POT], [5, 5, 2, POT]);
  o.push([-3, 5, 2, CHAIR], [-2, 5, 2, TABLE], [-1, 5, 2, CHAIR]);

  // ===== HỒ BƠI (bên phải nhà) =====
  const PX = W + 3; // tâm hồ
  fillBox(o, PX, 0, 2, PX + 6, 0, 9, CONCRETE_G);            // đáy
  walls(o, PX, 1, 2, PX + 6, 1, 9, CONCRETE_W);              // thành hồ
  fillBox(o, PX + 1, 1, 3, PX + 5, 1, 8, WATER);             // nước
  // sàn gỗ quanh hồ
  fillBox(o, PX, 1, 0, PX + 6, 1, 1, WOOD_FLOOR);
  fillBox(o, PX, 1, 10, PX + 6, 1, 11, WOOD_FLOOR);
  o.push([PX + 1, 2, 0, CHAIR], [PX + 3, 2, 0, CHAIR], [PX + 5, 2, 0, POT]);
  o.push([PX, 2, 10, LAMP], [PX + 6, 2, 10, LAMP]);
  return o;
}

// ---- 🏰 Lâu đài ----
function castle(): BlockPlacement[] {
  const o: BlockPlacement[] = [];
  const R = 12, H = 6;
  fillBox(o, -R, 0, 0, R, 0, R * 2, COBBLE);
  walls(o, -R, 1, 0, R, H, R * 2, COBBLE);
  for (let x = -R; x <= R; x += 2) o.push([x, H + 1, 0, COBBLE], [x, H + 1, R * 2, COBBLE]);
  for (let z = 0; z <= R * 2; z += 2) o.push([-R, H + 1, z, COBBLE], [R, H + 1, z, COBBLE]);
  for (const [tx, tz] of [[-R, 0], [R, 0], [-R, R * 2], [R, R * 2]]) {
    walls(o, tx - 2, 1, tz - 2, tx + 2, H + 4, tz + 2, COBBLE);
    fillBox(o, tx - 2, H + 4, tz - 2, tx + 2, H + 4, tz + 2, COBBLE);
    for (let x = tx - 2; x <= tx + 2; x += 2) for (let z = tz - 2; z <= tz + 2; z += 2)
      o.push([x, H + 5, z, COBBLE]);
    o.push([tx, H + 5, tz, GLOW]);
  }
  fillBox(o, -2, 1, 0, 2, 4, 0, AIR);
  fillBox(o, -3, 1, 0, -3, 5, 0, BRICKS);
  fillBox(o, 3, 1, 0, 3, 5, 0, BRICKS);
  fillBox(o, -3, 5, 0, 3, 5, 0, BRICKS);
  fillBox(o, -1, 0, 0, 1, 0, R * 2 - 4, BRICKS);
  const K = 5, KZ = R - K + R / 2;
  walls(o, -K, 1, KZ, K, H + 3, R + K + R / 2, BRICKS);
  fillBox(o, -K, H + 4, KZ, K, H + 4, R + K + R / 2, BRICKS);
  fillBox(o, 0, 1, KZ, 0, 3, KZ, AIR);
  for (const y of [3, 4]) for (const x of [-3, 3]) o.push([x, y, KZ, GLASS]);
  o.push([0, H + 5, R + R / 2, GLOW]);
  for (const [x, z] of [[-6, 6], [6, 6], [-6, R + 4], [6, R + 4]]) {
    fillBox(o, x, 1, z, x, 2, z, LOG);
    o.push([x, 3, z, GLOW]);
  }
  // nội thất sảnh chính
  o.push([-3, 1, R + R / 2, TABLE], [-2, 1, R + R / 2, TABLE], [-3, 1, R + R / 2 - 1, CHAIR], [-2, 1, R + R / 2 + 1, CHAIR]);
  o.push([3, 1, R + R / 2, BOOKSHELF], [3, 2, R + R / 2, BOOKSHELF]);
  return o;
}

// ---- 🐉 Hầm ngục rồng ----
function dragonDungeon(): BlockPlacement[] {
  const o: BlockPlacement[] = [];
  const W = 7, D = 28, H = 8;
  fillBox(o, -W, 0, 0, W, 0, D, COBBLE);
  walls(o, -W, 1, 0, W, H - 1, D, BRICKS);
  fillBox(o, -W, H, 0, W, H, D, BRICKS);
  fillBox(o, -1, 1, 0, 1, 3, 0, AIR);
  for (let z = 4; z <= D - 8; z += 4) {
    for (const x of [-W + 2, W - 2]) {
      fillBox(o, x, 1, z, x, H - 1, z, COBBLE);
      o.push([x, 4, z + 1, GLOW]);
    }
  }
  fillBox(o, -5, 1, D - 7, 5, 1, D - 1, OBSIDIAN);
  for (const [x, z, id] of [[-3, D - 3, GOLD], [-2, D - 2, GOLD], [3, D - 3, DIAMOND], [2, D - 2, DIAMOND], [0, D - 2, GOLD]] as const) {
    o.push([x, 2, z, id]);
  }
  const dz = D - 5;
  fillBox(o, -1, 2, dz - 2, 1, 3, dz + 2, OBSIDIAN);
  fillBox(o, -1, 4, dz - 1, 1, 4, dz + 1, OBSIDIAN);
  fillBox(o, 0, 4, dz - 3, 0, 5, dz - 3, OBSIDIAN);
  fillBox(o, -1, 6, dz - 5, 1, 6, dz - 4, OBSIDIAN);
  fillBox(o, -1, 7, dz - 5, 1, 7, dz - 5, OBSIDIAN);
  o.push([-1, 7, dz - 6, GLOW], [1, 7, dz - 6, GLOW]);
  fillBox(o, 0, 6, dz - 6, 0, 6, dz - 7, OBSIDIAN);
  for (let i = 0; i < 4; i++) {
    o.push([-2 - i, 4 + i, dz, OBSIDIAN], [-2 - i, 4 + i, dz + 1, OBSIDIAN]);
    o.push([2 + i, 4 + i, dz, OBSIDIAN], [2 + i, 4 + i, dz + 1, OBSIDIAN]);
  }
  fillBox(o, 0, 2, dz + 3, 0, 3, dz + 4, OBSIDIAN);
  o.push([0, 2, dz + 5, OBSIDIAN]);
  for (const x of [-4, 4]) for (const z of [dz - 2, dz + 2]) o.push([x, 2, z, GLOW]);
  return o;
}

// ---- 🧙 Tháp phù thủy ----
function wizardTower(): BlockPlacement[] {
  const o: BlockPlacement[] = [];
  const H = 16, R = 4;
  const inside = (x: number, z: number, r: number) => x * x + z * z <= r * r + 1;
  for (let y = 0; y <= H; y++) for (let x = -R; x <= R; x++) for (let z = -R; z <= R; z++) {
    const isWall = inside(x, z, R) && !inside(x, z, R - 1);
    if (y === 0 && inside(x, z, R)) o.push([x, 0, z + R, BRICKS]);
    else if (isWall && y <= H - 4) {
      const ang = Math.atan2(z, x);
      const winY = ((ang + Math.PI) / (Math.PI * 2) * 12 + 2) | 0;
      o.push([x, y, z + R, (y === winY || y === winY + 1) && y > 1 ? GLASS : BRICKS]);
    }
  }
  fillBox(o, 0, 1, R, 0, 2, R, AIR);
  o.push([0, 3, R, GLOW]);
  for (let x = -R - 1; x <= R + 1; x++) for (let z = -R - 1; z <= R + 1; z++) {
    if (inside(x, z, R + 1)) o.push([x, H - 3, z + R, PLANKS]);
  }
  for (let x = -R; x <= R; x++) for (let z = -R; z <= R; z++) {
    if (inside(x, z, R) && !inside(x, z, R - 1)) {
      o.push([x, H - 2, z + R, GLASS], [x, H - 1, z + R, GLASS]);
    }
    if (inside(x, z, R - 1)) o.push([x, H, z + R, GLASS]);
  }
  o.push([0, H - 2, R, GLOW]);
  o.push([1, 1, R + 2, BOOKSHELF], [2, 1, R + 2, BOOKSHELF], [-2, 1, R + 1, TABLE], [-2, 1, R + 2, CHAIR]);
  return o;
}

// ---- 🔺 Kim tự tháp ----
function pyramid(): BlockPlacement[] {
  const o: BlockPlacement[] = [];
  const R = 10;
  for (let y = 0; y <= R; y++) {
    const r = R - y;
    for (let x = -r; x <= r; x++) for (let z = -r; z <= r; z++) {
      const edge = Math.abs(x) === r || Math.abs(z) === r;
      if (edge || y === 0) o.push([x, y, z + R, SAND]);
    }
  }
  fillBox(o, -3, 1, R - 3, 3, 4, R + 3, AIR);
  fillBox(o, -1, 1, 1, 1, 2, R - 3, AIR);
  fillBox(o, 0, 1, 0, 0, 2, 1, AIR);
  o.push([0, 4, R, GLOW]);
  for (const [x, z, id] of [[-2, R, GOLD], [2, R, GOLD], [0, R + 2, DIAMOND], [-2, R + 2, GOLD], [2, R - 2, IRON]] as const) {
    o.push([x, 1, z, id]);
  }
  return o;
}

// ---- 🌉 Cầu đá ----
function bridge(): BlockPlacement[] {
  const o: BlockPlacement[] = [];
  const L = 30, W = 2;
  fillBox(o, -W, 0, 0, W, 0, L, BRICKS);
  for (let z = 0; z <= L; z++) o.push([-W, 1, z, COBBLE], [W, 1, z, COBBLE]);
  for (let z = 0; z <= L; z += 6) {
    o.push([-W, 2, z, COBBLE], [W, 2, z, COBBLE]);
    o.push([-W, 3, z, GLOW], [W, 3, z, GLOW]);
    fillBox(o, -W, -8, z, -W, -1, z, COBBLE);
    fillBox(o, W, -8, z, W, -1, z, COBBLE);
  }
  return o;
}

// ---- 🗼 Hải đăng ----
function lighthouse(): BlockPlacement[] {
  const o: BlockPlacement[] = [];
  const H = 18, R = 3;
  const inside = (x: number, z: number, r: number) => x * x + z * z <= r * r + 0.5;
  for (let y = 0; y <= H; y++) for (let x = -R; x <= R; x++) for (let z = -R; z <= R; z++) {
    if (inside(x, z, R) && !inside(x, z, R - 1)) {
      o.push([x, y, z + R, (y / 3 | 0) % 2 === 0 ? BRICKS : SNOW]);
    }
    if (y === 0 && inside(x, z, R)) o.push([x, 0, z + R, COBBLE]);
  }
  fillBox(o, 0, 1, R, 0, 2, R, AIR);
  fillBox(o, -2, H + 1, R - 2, 2, H + 1, R + 2, COBBLE);
  for (const [x, z] of [[-2, R - 2], [2, R - 2], [-2, R + 2], [2, R + 2]]) {
    fillBox(o, x, H + 2, z, x, H + 3, z, COBBLE);
  }
  fillBox(o, -1, H + 2, R - 1, 1, H + 3, R + 1, GLOW);
  fillBox(o, -2, H + 4, R - 2, 2, H + 4, R + 2, COBBLE);
  return o;
}

// ---- 🐲 Tượng rồng ----
function dragonStatue(): BlockPlacement[] {
  const o: BlockPlacement[] = [];
  fillBox(o, -4, 0, 0, 4, 0, 12, COBBLE);
  fillBox(o, -3, 1, 1, 3, 1, 11, OBSIDIAN);
  fillBox(o, -2, 2, 4, 2, 4, 9, OBSIDIAN);
  fillBox(o, -1, 5, 5, 1, 5, 8, OBSIDIAN);
  fillBox(o, 0, 5, 3, 0, 7, 4, OBSIDIAN);
  fillBox(o, -1, 8, 1, 1, 9, 3, OBSIDIAN);
  o.push([-1, 9, 0, GLOW], [1, 9, 0, GLOW]);
  fillBox(o, 0, 8, 0, 0, 8, -1, OBSIDIAN);
  for (let i = 0; i < 6; i++) {
    fillBox(o, -3 - i, 4 + i, 6, -3 - i, 5 + i, 8, OBSIDIAN);
    fillBox(o, 3 + i, 4 + i, 6, 3 + i, 5 + i, 8, OBSIDIAN);
  }
  fillBox(o, 0, 2, 10, 0, 4, 11, OBSIDIAN);
  o.push([0, 5, 12, OBSIDIAN], [0, 6, 12, OBSIDIAN]);
  for (const [x, z] of [[-3, 1], [3, 1], [-3, 11], [3, 11]]) o.push([x, 2, z, GLOW]);
  return o;
}

export const STRUCTURES: Structure[] = [
  { id: 'modern',     emoji: '🏡', name: 'Nhà hiện đại',   desc: 'Biệt thự 2 tầng kính + bê tông, full nội thất, hồ bơi', gen: modernHouse },
  { id: 'house',      emoji: '🏠', name: 'Nhà gỗ',         desc: 'Nhà ván gỗ ấm cúng có giường, bàn ghế, kệ sách', gen: house },
  { id: 'castle',     emoji: '🏰', name: 'Lâu đài',        desc: 'Tường thành, 4 tháp canh, cổng và sảnh chính', gen: castle },
  { id: 'dungeon',    emoji: '🐉', name: 'Hầm ngục rồng',  desc: 'Đại sảnh tối tăm, kho báu và tượng rồng obsidian', gen: dragonDungeon },
  { id: 'tower',      emoji: '🧙', name: 'Tháp phù thủy',  desc: 'Tháp gạch cao với cửa sổ xoắn ốc và vòm kính', gen: wizardTower },
  { id: 'pyramid',    emoji: '🔺', name: 'Kim tự tháp',    desc: 'Kim tự tháp cát ẩn giấu phòng kho báu', gen: pyramid },
  { id: 'bridge',     emoji: '🌉', name: 'Cầu đá',         desc: 'Cầu gạch dài 30 block có trụ đèn', gen: bridge },
  { id: 'lighthouse', emoji: '🗼', name: 'Hải đăng',       desc: 'Tháp sọc đỏ trắng với đèn biển rực sáng', gen: lighthouse },
  { id: 'dragon',     emoji: '🐲', name: 'Tượng rồng',     desc: 'Rồng obsidian khổng lồ xoè cánh, mắt phát sáng', gen: dragonStatue },
];
