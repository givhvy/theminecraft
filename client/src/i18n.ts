// Đa ngôn ngữ EN/VI — mặc định English, lưu lựa chọn trong localStorage
import { B, TOOLS, type ToolId } from '@shared/blocks';
import type { Structure } from '@shared/structures';

export type Lang = 'en' | 'vi';
const LS_LANG = 'theminecraft_lang';

export let lang: Lang = (localStorage.getItem(LS_LANG) === 'vi' ? 'vi' : 'en');

export const i18nEvents = new EventTarget();

export function setLang(l: Lang): void {
  lang = l;
  localStorage.setItem(LS_LANG, l);
  document.documentElement.lang = l;
  i18nEvents.dispatchEvent(new Event('change'));
}

const DICT: Record<string, { en: string; vi: string }> = {
  // overlay / hướng dẫn
  controlsMove:   { en: '<b>WASD</b> move · <b>Space</b> jump/swim · <b>F</b> fly · <b>E</b> inventory · <b>B</b> 🤖 AI Builder',
                    vi: '<b>WASD</b> di chuyển · <b>Space</b> nhảy/bơi · <b>F</b> bay · <b>E</b> kho đồ · <b>B</b> 🤖 AI Builder' },
  controlsMouse:  { en: '<b>Hold left click</b> break block / attack · <b>Right click</b> place block / ride 🐴 board 🛶 · <b>Shift</b> dismount',
                    vi: '<b>Giữ chuột trái</b> phá block / tấn công · <b>Chuột phải</b> đặt block / cưỡi 🐴 lên 🛶 · <b>Shift</b> xuống' },
  controlsHotbar: { en: '<b>1-9</b> / scroll to pick slot · Hit <b>TNT</b> to ignite 💥 · ⛏ Dig deep for 💎 diamonds, beware 🔥 lava!',
                    vi: '<b>1-9</b> / lăn chuột chọn ô · Đập vào <b>TNT</b> để kích nổ 💥 · ⛏ Đào sâu tìm 💎 kim cương, coi chừng 🔥 dung nham!' },
  controlsMobs:   { en: 'Watch out for <b style="color:#7fc97f">zombies</b> and <b style="color:#6ee06e">creepers</b> at night!',
                    vi: 'Cẩn thận <b style="color:#7fc97f">zombie</b> và <b style="color:#6ee06e">creeper</b> vào ban đêm!' },
  clickToPlay:    { en: 'Click to play', vi: 'Nhấp để chơi' },
  yourName:       { en: 'Your name…', vi: 'Tên của bạn…' },
  // tài khoản
  account:        { en: 'Account (optional)', vi: 'Tài khoản (tuỳ chọn)' },
  username:       { en: 'Username', vi: 'Tên đăng nhập' },
  password:       { en: 'Password', vi: 'Mật khẩu' },
  login:          { en: 'Log in', vi: 'Đăng nhập' },
  register:       { en: 'Register', vi: 'Đăng ký' },
  logout:         { en: 'Log out', vi: 'Đăng xuất' },
  loggedInAs:     { en: 'Logged in as', vi: 'Đang đăng nhập:' },
  guestHint:      { en: 'or just play as guest — no account needed', vi: 'hoặc chơi ngay không cần tài khoản' },
  errTaken:       { en: 'Username already taken', vi: 'Tên đã có người dùng' },
  errInvalid:     { en: 'Wrong username or password', vi: 'Sai tên đăng nhập hoặc mật khẩu' },
  errBadName:     { en: 'Name: 2-16 letters/numbers', vi: 'Tên: 2-16 chữ/số' },
  errBadPassword: { en: 'Password: at least 4 characters', vi: 'Mật khẩu: ít nhất 4 ký tự' },
  errNetwork:     { en: 'Cannot reach server', vi: 'Không kết nối được server' },
  // HUD
  online:         { en: 'online', vi: 'trực tuyến' },
  local:          { en: 'local', vi: 'cục bộ' },
  players:        { en: 'Players', vi: 'Người chơi' },
  profile:        { en: 'Profile', vi: 'Hồ sơ' },
  time:           { en: 'Time', vi: 'Giờ' },
  hand:           { en: 'Hand', vi: 'Tay' },
  flying:         { en: '✈ flying', vi: '✈ bay' },
  ridingHorse:    { en: '🐴 riding (Shift to dismount)', vi: '🐴 cưỡi ngựa (Shift xuống)' },
  ridingBoat:     { en: '🛶 boating (Shift to get off)', vi: '🛶 trên thuyền (Shift xuống)' },
  serverFull:     { en: 'Server is full (10/10) — try again later', vi: 'Server đầy (10/10) — thử lại sau' },
  saved:          { en: '✔ World saved', vi: '✔ Đã lưu thế giới' },
  // modal
  invTitle:       { en: 'Pick block / tool / furniture for selected slot (E to close)', vi: 'Chọn block / dụng cụ / nội thất cho ô đang chọn (E để đóng)' },
  buildTitle:     { en: '🤖 AI Builder — pick a structure to build in front of you (B to close)', vi: '🤖 AI Builder — chọn công trình để xây trước mặt bạn (B để đóng)' },
  died:           { en: 'You died!', vi: 'Bạn đã chết!' },
  respawn:        { en: 'Respawn', vi: 'Hồi sinh' },
  building:       { en: '🤖 Building', vi: '🤖 Đang xây' },
  builtDone:      { en: '✅ Finished building', vi: '✅ Đã xây xong' },
  boat:           { en: 'Boat', vi: 'Thuyền' },
};

export function t(key: string): string {
  const e = DICT[key];
  return e ? e[lang] : key;
}

export function blockName(id: number): string {
  const def = B[id];
  return def ? (lang === 'vi' ? def.name : def.nameEn) : '?';
}
export function toolName(id: ToolId): string {
  return lang === 'vi' ? TOOLS[id].name : TOOLS[id].nameEn;
}
export function structName(s: Structure): string {
  return lang === 'vi' ? s.name : s.nameEn;
}
export function structDesc(s: Structure): string {
  return lang === 'vi' ? s.desc : s.descEn;
}

document.documentElement.lang = lang;
