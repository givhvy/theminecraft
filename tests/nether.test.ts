import { describe, it, expect, beforeEach } from 'vitest';
import { WorldMap, worldManager, switchWorldDimension } from '@shared/world';
import { BEDROCK, NETHERRACK, LAVA } from '@shared/blocks';

describe('Nether dimension', () => {
  beforeEach(() => {
    switchWorldDimension('overworld');
  });

  it('sinh chunk nether có netherrack và bedrock', () => {
    const nether = new WorldMap('nether');
    const b = nether.getBlock(8, 30, 8);
    expect([NETHERRACK, LAVA, BEDROCK]).toContain(b);
  });

  it('worldManager có 2 chiều', () => {
    expect(worldManager.worlds.overworld.dimension).toBe('overworld');
    expect(worldManager.worlds.nether.dimension).toBe('nether');
    switchWorldDimension('nether');
    expect(worldManager.currentDimension).toBe('nether');
  });
});
