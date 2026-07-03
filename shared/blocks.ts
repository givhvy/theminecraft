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
  /** block portal — đi xuyên qua */
  portal?: boolean;
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
  // ---- Nether + công viên ----
  40: { name: 'Đá đỏ Nether',  nameEn: 'Netherrack',     tiles: { top: 46, bottom: 46, side: 46 }, hardness: 0.8, mat: 'stone' },
  41: { name: 'Cổng Nether',   nameEn: 'Nether Portal',  tiles: { top: 47, bottom: 47, side: 47 }, hardness: 0, mat: 'other', transparent: true, emissive: true, portal: true },
  42: { name: 'Bê tông đỏ',    nameEn: 'Red Concrete',   tiles: { top: 48, bottom: 48, side: 48 }, hardness: 2.5, mat: 'stone' },
  43: { name: 'Bê tông vàng',  nameEn: 'Yellow Concrete', tiles: { top: 49, bottom: 49, side: 49 }, hardness: 2.5, mat: 'stone' },
  44: { name: 'Bê tông xanh',  nameEn: 'Blue Concrete',  tiles: { top: 50, bottom: 50, side: 50 }, hardness: 2.5, mat: 'stone' },
  45: { name: 'Bê tông hồng',  nameEn: 'Pink Concrete',  tiles: { top: 51, bottom: 51, side: 51 }, hardness: 2.5, mat: 'stone' },
  // ---- nội thất mở rộng ----
  46: { name: 'Tủ quần áo',    nameEn: 'Wardrobe',        tiles: { top: 27, bottom: 27, side: 52 }, hardness: 1.2, mat: 'wood' },
  47: { name: 'Đàn piano',     nameEn: 'Piano',           tiles: { top: 54, bottom: 26, side: 53 }, hardness: 1.0, mat: 'wood' },
  48: { name: 'Bồn cầu',       nameEn: 'Toilet',          tiles: { top: 55, bottom: 24, side: 55 }, hardness: 0.8, mat: 'stone' },
  49: { name: 'Bồn tắm',       nameEn: 'Bathtub',         tiles: { top: 57, bottom: 24, side: 56 }, hardness: 0.8, mat: 'stone' },
  50: { name: 'Bồn rửa mặt',   nameEn: 'Sink',            tiles: { top: 57, bottom: 24, side: 58 }, hardness: 0.6, mat: 'stone' },
  51: { name: 'Gương',         nameEn: 'Mirror',          tiles: { top: 8,  bottom: 8,  side: 59 }, hardness: 0.4, mat: 'glass' },
  52: { name: 'Máy tính',      nameEn: 'Computer',        tiles: { top: 26, bottom: 26, side: 60 }, hardness: 1.0, mat: 'metal' },
  53: { name: 'Máy giặt',      nameEn: 'Washing Machine', tiles: { top: 24, bottom: 24, side: 61 }, hardness: 1.5, mat: 'metal' },
  54: { name: 'Lò sưởi',       nameEn: 'Fireplace',       tiles: { top: 11, bottom: 11, side: 62 }, hardness: 2.0, mat: 'stone', emissive: true },
  55: { name: 'Đồng hồ treo',  nameEn: 'Wall Clock',      tiles: { top: 8,  bottom: 8,  side: 63 }, hardness: 0.4, mat: 'wood' },
  56: { name: 'Bể cá',         nameEn: 'Aquarium',        tiles: { top: 9,  bottom: 8,  side: 64 }, hardness: 0.4, mat: 'glass', transparent: true },
  57: { name: 'Cây cảnh',      nameEn: 'Potted Plant',    tiles: { top: 6,  bottom: 41, side: 65 }, hardness: 0.3, mat: 'leaf', transparent: true },
};

export const WATER = 9, BEDROCK = 13, TNT = 20, OBSIDIAN = 18, LAVA = 39;
export const GRASS = 1, DIRT = 2, STONE = 3, LOG = 4, LEAVES = 5, SAND = 6,
  PLANKS = 7, GLASS = 8, COBBLE = 10, BRICKS = 11, SNOW = 12,
  COAL = 14, IRON = 15, GOLD = 16, DIAMOND = 17, GLOW = 19;
export const CONCRETE_W = 21, CONCRETE_G = 22, CONCRETE_B = 23, WOOD_FLOOR = 24,
  BOOKSHELF = 25, TABLE = 26, CHAIR = 27, BED = 28, SOFA = 29, FRIDGE = 30,
  STOVE = 31, TV = 32, LAMP = 33, CARPET = 34, PAINTING = 35, POT = 36,
  CABINET = 37, FENCE = 38;
export const NETHERRACK = 40, PORTAL = 41;
export const CONCRETE_R = 42, CONCRETE_Y = 43, CONCRETE_BL = 44, CONCRETE_P = 45;

/** id nội thất (furniture) */
export const FURNITURE_IDS = [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
  46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57];

export type ToolId =
  | 'sword' | 'gold_sword' | 'diamond_sword'
  | 'pickaxe' | 'diamond_pickaxe' | 'axe' | 'shovel';
export type ToolTier = 'iron' | 'gold' | 'diamond';
export interface ToolDef {
  name: string; nameEn: string; dmg: number; fast: BlockMat | BlockMat[];
  tier: ToolTier;
  /** vũ khí — hiện trong tab Vũ khí thay vì Dụng cụ */
  weapon?: boolean;
  /** hệ số đào nhanh khi đúng chất liệu (mặc định 3.5) */
  speed?: number;
}

export const TOOLS: Record<ToolId, ToolDef> = {
  sword:           { name: 'Kiếm sắt',        nameEn: 'Iron Sword',      dmg: 8,  fast: ['leaf', 'cloth'], tier: 'iron',    weapon: true },
  gold_sword:      { name: 'Kiếm vàng',       nameEn: 'Gold Sword',      dmg: 12, fast: ['leaf', 'cloth'], tier: 'gold',    weapon: true },
  diamond_sword:   { name: 'Kiếm kim cương',  nameEn: 'Diamond Sword',   dmg: 16, fast: ['leaf', 'cloth'], tier: 'diamond', weapon: true },
  pickaxe:         { name: 'Cúp sắt',         nameEn: 'Iron Pickaxe',    dmg: 4,  fast: ['stone', 'metal'], tier: 'iron' },
  diamond_pickaxe: { name: 'Cúp kim cương',   nameEn: 'Diamond Pickaxe', dmg: 6,  fast: ['stone', 'metal'], tier: 'diamond', speed: 6 },
  axe:             { name: 'Rìu',             nameEn: 'Axe',             dmg: 4,  fast: 'wood',  tier: 'iron' },
  shovel:          { name: 'Xẻng',            nameEn: 'Shovel',          dmg: 3,  fast: 'earth', tier: 'iron' },
};

export const IGNITER = { name: 'Lửa mồi', nameEn: 'Igniter' };

export function toolIsFast(tool: ToolDef, mat: BlockMat): boolean {
  return Array.isArray(tool.fast) ? tool.fast.includes(mat) : tool.fast === mat;
}

export function isValidBlockId(id: number): boolean {
  return id === AIR || !!B[id];
}

export function isPortalBlock(id: number): boolean {
  return !!B[id]?.portal;
}
