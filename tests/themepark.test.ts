import { describe, it, expect } from 'vitest';
import { themeParkLocation, getThemeParkPlacements, isNearThemePark } from '@shared/themepark';

describe('ThemePark', () => {
  it('vị trí công viên deterministic theo SEED', () => {
    const a = themeParkLocation();
    const b = themeParkLocation();
    expect(a).toEqual(b);
    expect(Math.hypot(a.cx, a.cz)).toBeGreaterThan(80);
  });

  it('sinh công trình công viên', () => {
    const placements = getThemeParkPlacements();
    expect(placements.length).toBeGreaterThan(100);
  });

  it('isNearThemePark phát hiện vùng gần công viên', () => {
    const b = themeParkLocation();
    expect(isNearThemePark(b.cx, b.cz)).toBe(true);
    expect(isNearThemePark(0, 0)).toBe(false);
  });
});
