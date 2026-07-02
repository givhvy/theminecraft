// Chiều không gian thế giới (Overworld + Nether)
export type DimensionId = 'overworld' | 'nether';

export const DIMENSIONS: DimensionId[] = ['overworld', 'nether'];

export function isDimensionId(s: unknown): s is DimensionId {
  return s === 'overworld' || s === 'nether';
}
