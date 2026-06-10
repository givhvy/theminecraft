// Danh sách thực thể dùng chung (tránh import vòng tròn)
import type { Mob } from './mobs';
import type { Boat } from './boat';

export const mobs: Mob[] = [];
export const boats: Boat[] = [];

export interface TntEntity {
  mesh: import('three').Mesh;
  fuse: number;
  x: number; y: number; z: number;
}
export const tntEntities: TntEntity[] = [];
