// Định nghĩa block và dụng cụ
export const AIR = 0;

// id: { name, tiles {top,bottom,side}, hardness, mat, transparent, liquid, emissive, noBreak }
export const B = {
  1:  { name: 'Cỏ',           tiles: { top: 0,  bottom: 2,  side: 1  }, hardness: 0.6, mat: 'earth' },
  2:  { name: 'Đất',          tiles: { top: 2,  bottom: 2,  side: 2  }, hardness: 0.5, mat: 'earth' },
  3:  { name: 'Đá',           tiles: { top: 3,  bottom: 3,  side: 3  }, hardness: 3.0, mat: 'stone' },
  4:  { name: 'Gỗ',           tiles: { top: 5,  bottom: 5,  side: 4  }, hardness: 2.0, mat: 'wood'  },
  5:  { name: 'Lá',           tiles: { top: 6,  bottom: 6,  side: 6  }, hardness: 0.2, mat: 'leaf', transparent: true },
  6:  { name: 'Cát',          tiles: { top: 7,  bottom: 7,  side: 7  }, hardness: 0.5, mat: 'earth' },
  7:  { name: 'Ván gỗ',       tiles: { top: 8,  bottom: 8,  side: 8  }, hardness: 1.5, mat: 'wood'  },
  8:  { name: 'Kính',         tiles: { top: 9,  bottom: 9,  side: 9  }, hardness: 0.3, mat: 'glass', transparent: true },
  9:  { name: 'Nước',         tiles: { top: 23, bottom: 23, side: 23 }, hardness: 0,   mat: 'other', liquid: true, transparent: true },
  10: { name: 'Đá cuội',      tiles: { top: 10, bottom: 10, side: 10 }, hardness: 3.5, mat: 'stone' },
  11: { name: 'Gạch',         tiles: { top: 11, bottom: 11, side: 11 }, hardness: 3.5, mat: 'stone' },
  12: { name: 'Cỏ tuyết',     tiles: { top: 12, bottom: 2,  side: 13 }, hardness: 0.6, mat: 'earth' },
  13: { name: 'Bedrock',      tiles: { top: 14, bottom: 14, side: 14 }, hardness: Infinity, mat: 'stone', noBreak: true },
  14: { name: 'Quặng than',   tiles: { top: 15, bottom: 15, side: 15 }, hardness: 4.0, mat: 'stone' },
  15: { name: 'Quặng sắt',    tiles: { top: 16, bottom: 16, side: 16 }, hardness: 4.5, mat: 'stone' },
  16: { name: 'Quặng vàng',   tiles: { top: 17, bottom: 17, side: 17 }, hardness: 4.5, mat: 'stone' },
  17: { name: 'Kim cương',    tiles: { top: 18, bottom: 18, side: 18 }, hardness: 5.0, mat: 'stone' },
  18: { name: 'Obsidian',     tiles: { top: 19, bottom: 19, side: 19 }, hardness: 9.0, mat: 'stone' },
  19: { name: 'Đá sáng',      tiles: { top: 20, bottom: 20, side: 20 }, hardness: 0.5, mat: 'glass', emissive: true },
  20: { name: 'TNT',          tiles: { top: 22, bottom: 22, side: 21 }, hardness: 0.1, mat: 'other' },
};

export const WATER = 9, BEDROCK = 13, TNT = 20, OBSIDIAN = 18;
export const GRASS = 1, DIRT = 2, STONE = 3, LOG = 4, LEAVES = 5, SAND = 6,
  PLANKS = 7, GLASS = 8, COBBLE = 10, BRICKS = 11, SNOW = 12,
  COAL = 14, IRON = 15, GOLD = 16, DIAMOND = 17, GLOW = 19;

export const TOOLS = {
  sword:   { name: 'Kiếm',  dmg: 8, fast: 'leaf'  },
  pickaxe: { name: 'Cúp',   dmg: 4, fast: 'stone' },
  axe:     { name: 'Rìu',   dmg: 4, fast: 'wood'  },
  shovel:  { name: 'Xẻng',  dmg: 3, fast: 'earth' },
};
