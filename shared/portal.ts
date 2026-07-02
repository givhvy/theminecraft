// Logic khung portal Obsidian + kích hoạt cổng Nether
import { OBSIDIAN, PORTAL, AIR } from './blocks.js';

export interface PortalFrame {
  /** góc dưới-trái-trước của khung */
  minX: number; minY: number; minZ: number;
  /** kích thước lỗ bên trong (rộng x cao) */
  innerW: number; innerH: number;
  /** trục portal: 'x' hoặc 'z' (mặt phẳng vuông góc) */
  axis: 'x' | 'z';
}

type GetBlock = (x: number, y: number, z: number) => number;
type SetBlock = (x: number, y: number, z: number, id: number) => void;

/** kiểm tra khung obsidian 4x5 (tối thiểu) tại block được click */
export function findPortalFrameAt(x: number, y: number, z: number, getBlock: GetBlock): PortalFrame | null {
  // thử cả hai hướng
  for (const axis of ['x', 'z'] as const) {
    const frame = scanFrameAt(x, y, z, axis, getBlock);
    if (frame) return frame;
  }
  return null;
}

function scanFrameAt(x: number, y: number, z: number, axis: 'x' | 'z', getBlock: GetBlock): PortalFrame | null {
  // tìm góc dưới-trái của khung chứa (x,y,z)
  for (let dy = 0; dy <= 4; dy++) {
    for (let dw = 0; dw <= 3; dw++) {
      let minX = x, minY = y - dy, minZ = z;
      if (axis === 'x') { minX -= dw; }
      else { minZ -= dw; }
      for (const [innerW, innerH] of [[2, 3], [3, 4], [4, 5]] as [number, number][]) {
        if (isValidFrame(minX, minY, minZ, innerW, innerH, axis, getBlock)) {
          return { minX, minY, minZ, innerW, innerH, axis };
        }
      }
    }
  }
  return null;
}

function isValidFrame(minX: number, minY: number, minZ: number, innerW: number, innerH: number, axis: 'x' | 'z', getBlock: GetBlock): boolean {
  const outerW = innerW + 2, outerH = innerH + 2;
  for (let h = 0; h < outerH; h++) for (let w = 0; w < outerW; w++) {
    const isBorder = h === 0 || h === outerH - 1 || w === 0 || w === outerW - 1;
    let bx: number, by: number, bz: number;
    if (axis === 'x') { bx = minX + w; by = minY + h; bz = minZ; }
    else { bx = minX; by = minY + h; bz = minZ + w; }
    const b = getBlock(bx, by, bz);
    if (isBorder) {
      if (b !== OBSIDIAN) return false;
    } else {
      if (b !== AIR) return false;
    }
  }
  return true;
}

/** fill lỗ khung bằng block portal */
export function activatePortal(frame: PortalFrame, setBlock: SetBlock): void {
  const { minX, minY, minZ, innerW, innerH, axis } = frame;
  for (let h = 1; h <= innerH; h++) for (let w = 1; w <= innerW; w++) {
    if (axis === 'x') setBlock(minX + w, minY + h, minZ, PORTAL);
    else setBlock(minX, minY + h, minZ + w, PORTAL);
  }
}

/** tạo portal về ở Nether/Overworld khi teleport */
export function createReturnPortal(wx: number, wy: number, wz: number, setBlock: SetBlock): void {
  // khung 4x5 đơn giản hướng z
  for (let h = 0; h < 5; h++) for (let w = 0; w < 4; w++) {
    const isBorder = h === 0 || h === 4 || w === 0 || w === 3;
    const bx = wx + w, by = wy + h, bz = wz;
    setBlock(bx, by, bz, isBorder ? OBSIDIAN : PORTAL);
  }
}

export function isInsidePortal(x: number, y: number, z: number, getBlock: GetBlock): boolean {
  const b = getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
  return b === PORTAL;
}
