// Cài đặt người chơi: hiện/ẩn HUD info + đồ hoạ nâng cao — lưu localStorage
import { applyGraphics } from './scene';

const LS = 'theminecraft_settings';

export interface Settings {
  /** hiện FPS / XYZ / giờ ở góc trên trái */
  showHud: boolean;
  /** đồ hoạ nâng cao: bóng 4096, pixel ratio cao (tốn GPU hơn) */
  fancy: boolean;
}

export const settings: Settings = { showHud: true, fancy: false };
try {
  Object.assign(settings, JSON.parse(localStorage.getItem(LS) || '{}'));
} catch { /* noop */ }

export function applySettings(): void {
  localStorage.setItem(LS, JSON.stringify(settings));
  document.body.classList.toggle('nohud', !settings.showHud);
  applyGraphics(settings.fancy);
}

applySettings();
