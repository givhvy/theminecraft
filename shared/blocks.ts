// Định nghĩa block và dụng cụ (tên song ngữ VI/EN cho i18n)
export const AIR = 0;

export type BlockMat = 'earth' | 'stone' | 'wood' | 'leaf' | 'glass' | 'cloth' | 'metal' | 'other';

export interface BlockDef {
  name: string;      // tiếng Việt
  nameEn: string;    // English
  tiles: { top: number; bottom: number; side: number };
  hardness: number;
  mat: BlockMat;
  transparent?: boolean;
  liquid?: boolean;
  emissive?: boolean;
  noBreak?: boolean;
  /** gây sát thương khi chạm (mỗi giây) */
  damage?: number;
}

export const B: Record<number, BlockDef> = {
  // ---- tự nhiên ----
  1:  { name: 'Cỏ',            nameEn: 'Grass',          tiles: { top: 0,  bottom: 2,  side: 1  }, hardness: 0.6, mat: 'earth' },
  2:  { name: 'Đất',           nameEn: 'Dirt',           tiles: { top: 2,  bottom: 2,  side: 2  }, hardness: 0.5, mat: 'earth' },
  3:  { name: 'Đá',            nameEn: 'Stone',          tiles: { top: 3,  bottom: 3,  side: 3  }, hardness: 3.0, mat: 'stone' },
  4:  { name: 'Gỗ',            nameEn: 'Log',            tiles: { top: 5,  bottom: 5,  side: 4  }, hardness: 2.0, mat: 'wood'  },
  5:  { name: 'Lá',            nameEn: 'Leaves',         tiles: { top: 6,  bottom: 6,  side: 6  }, hardness: 0.2, mat: 'leaf', transparent: true },
  6:  { name: 'Cát',           nameEn: 'Sand',           tiles: { top: 7,  bottom: 7,  side: 7  }, hardness: 0.5, mat: 'earth' },
  7:  { name: 'Ván gỗ',        nameEn: 'Planks',         tiles: { top: 8,  bottom: 8,  side: 8  }, hardness: 1.5, mat: 'wood'  },
  8:  { name: 'Kính',          nameEn: 'Glass',          tiles: { top: 9,  bottom: 9,  side: 9  }, hardness: 0.3, mat: 'glass', transparent: true },
  9:  { name: 'Nước',          nameEn: 'Water',          tiles: { top: 23, bottom: 23, side: 23 }, hardness: 0,   mat: 'other', liquid: true, transparent: true },
  10: { name: 'Đá cuội',       nameEn: 'Cobblestone',    tiles: { top: 10, bottom: 10, side: 10 }, hardness: 3.5, mat: 'stone' },
  11: { name: 'Gạch',          nameEn: 'Bricks',         tiles: { top: 11, bottom: 11, side: 11 }, hardness: 3.5, mat: 'stone' },
  12: { name: 'Cỏ tuyết',      nameEn: 'Snowy Grass',    tiles: { top: 12, bottom: 2,  side: 13 }, hardness: 0.6, mat: 'earth' },
  13: { name: 'Bedrock',       nameEn: 'Bedrock',        tiles: { top: 14, bottom: 14, side: 14 }, hardness: Infinity, mat: 'stone', noBreak: true },
  14: { name: 'Quặng than',    nameEn: 'Coal Ore',       tiles: { top: 15, bottom: 15, side: 15 }, hardness: 4.0, mat: 'stone' },
  15: { name: 'Quặng sắt',     nameEn: 'Iron Ore',       tiles: { top: 16, bottom: 16, side: 16 }, hardness: 4.5, mat: 'stone' },
  16: { name: 'Quặng vàng',    nameEn: 'Gold Ore',       tiles: { top: 17, bottom: 17, side: 17 }, hardness: 4.5, mat: 'stone' },
  17: { name: 'Kim cương',     nameEn: 'Diamond Ore',    tiles: { top: 18, bottom: 18, side: 18 }, hardness: 5.0, mat: 'stone' },
  18: { name: 'Obsidian',      nameEn: 'Obsidian',       tiles: { top: 19, bottom: 19, side: 19 }, hardness: 9.0, mat: 'stone' },
  19: { name: 'Đá sáng',       nameEn: 'Glowstone',      tiles: { top: 20, bottom: 20, side: 20 }, hardness: 0.5, mat: 'glass', emissive: true },
  20: { name: 'TNT',           nameEn: 'TNT',            tiles: { top: 22, bottom: 22, side: 21 }, hardness: 0.1, mat: 'other' },
  // ---- xây dựng hiện đại ----
  21: { name: 'Bê tông trắng', nameEn: 'White Concrete', tiles: { top: 24, bottom: 24, side: 24 }, hardness: 2.5, mat: 'stone' },
  22: { name: 'Bê tông xám',   nameEn: 'Gray Concrete',  tiles: { top: 25, bottom: 25, side: 25 }, hardness: 2.5, mat: 'stone' },
  23: { name: 'Bê tông đen',   nameEn: 'Black Concrete', tiles: { top: 26, bottom: 26, side: 26 }, hardness: 2.5, mat: 'stone' },
  24: { name: 'Sàn gỗ sáng',   nameEn: 'Light Wood Floor', tiles: { top: 27, bottom: 27, side: 27 }, hardness: 1.5, mat: 'wood' },
  // ---- nội thất ----
  25: { name: 'Kệ sách',       nameEn: 'Bookshelf',      tiles: { top: 8,  bottom: 8,  side: 28 }, hardness: 1.2, mat: 'wood' },
  26: { name: 'Bàn gỗ',        nameEn: 'Table',          tiles: { top: 27, bottom: 27, side: 29 }, hardness: 1.0, mat: 'wood' },
  27: { name: 'Ghế gỗ',        nameEn: 'Chair',          tiles: { top: 30, bottom: 27, side: 30 }, hardness: 0.8, mat: 'wood' },
  28: { name: 'Giường',        nameEn: 'Bed',            tiles: { top: 31, bottom: 8,  side: 32 }, hardness: 0.6, mat: 'cloth' },
  29: { name: 'Sofa',          nameEn: 'Sofa',           tiles: { top: 33, bottom: 33, side: 33 }, hardness: 0.6, mat: 'cloth' },
  30: { name: 'Tủ lạnh',       nameEn: 'Fridge',         tiles: { top: 25, bottom: 25, side: 34 }, hardness: 2.0, mat: 'metal' },
  31: { name: 'Bếp lò',        nameEn: 'Stove',          tiles: { top: 35, bottom: 25, side: 36 }, hardness: 2.0, mat: 'metal' },
  32: { name: 'TV',            nameEn: 'TV',             tiles: { top: 26, bottom: 26, side: 37 }, hardness: 1.0, mat: 'metal' },
  33: { name: 'Đèn bàn',       nameEn: 'Lamp',           tiles: { top: 38, bottom: 38, side: 38 }, hardness: 0.3, mat: 'glass', emissive: true },
  34: { name: 'Thảm đỏ',       nameEn: 'Red Carpet',     tiles: { top: 39, bottom: 39, side: 39 }, hardness: 0.2, mat: 'cloth' },
  35: { name: 'Tranh',         nameEn: 'Painting',       tiles: { top: 8,  bottom: 8,  side: 40 }, hardness: 0.4, mat: 'wood' },
  36: { name: 'Chậu hoa',      nameEn: 'Flower Pot',     tiles: { top: 44, bottom: 41, side: 41 }, hardness: 0.3, mat: 'earth' },
  37: { name: 'Tủ bếp',        nameEn: 'Kitchen Cabinet', tiles: { top: 27, bottom: 25, side: 42 }, hardness: 1.2, mat: 'wood' },
  38: { name: 'Hàng rào',      nameEn: 'Fence',          tiles: { top: 43, bottom: 43, side: 43 }, hardness: 1.0, mat: 'wood', transparent: true },
  // ---- lòng đất ----
  39: { name: 'Dung nham',     nameEn: 'Lava',           tiles: { top: 45, bottom: 45, side: 45 }, hardness: 0, mat: 'other', liquid: true, emissive: true, damage: 4 },
};

export const WATER = 9, BEDROCK = 13, TNT = 20, OBSIDIAN = 18, LAVA = 39;
export const GRASS = 1, DIRT = 2, STONE = 3, LOG = 4, LEAVES = 5, SAND = 6,
  PLANKS = 7, GLASS = 8, COBBLE = 10, BRICKS = 11, SNOW = 12,
  COAL = 14, IRON = 15, GOLD = 16, DIAMOND = 17, GLOW = 19;
export const CONCRETE_W = 21, CONCRETE_G = 22, CONCRETE_B = 23, WOOD_FLOOR = 24,
  BOOKSHELF = 25, TABLE = 26, CHAIR = 27, BED = 28, SOFA = 29, FRIDGE = 30,
  STOVE = 31, TV = 32, LAMP = 33, CARPET = 34, PAINTING = 35, POT = 36,
  CABINET = 37, FENCE = 38;

export type ToolId = 'sword' | 'pickaxe' | 'axe' | 'shovel';
export interface ToolDef { name: string; nameEn: string; dmg: number; fast: BlockMat | BlockMat[] }

export const TOOLS: Record<ToolId, ToolDef> = {
  sword:   { name: 'Kiếm',  nameEn: 'Sword',   dmg: 8, fast: ['leaf', 'cloth'] },
  pickaxe: { name: 'Cúp',   nameEn: 'Pickaxe', dmg: 4, fast: ['stone', 'metal'] },
  axe:     { name: 'Rìu',   nameEn: 'Axe',     dmg: 4, fast: 'wood'  },
  shovel:  { name: 'Xẻng',  nameEn: 'Shovel',  dmg: 3, fast: 'earth' },
};

export function toolIsFast(tool: ToolDef, mat: BlockMat): boolean {
  return Array.isArray(tool.fast) ? tool.fast.includes(mat) : tool.fast === mat;
}

export function isValidBlockId(id: number): boolean {
  return id === AIR || !!B[id];
}
