// Màn hình chính: nhập tên, tài khoản (tuỳ chọn), chuyển ngôn ngữ, nút chơi
import { canvas } from './scene';
import { t, lang, setLang, i18nEvents, type Lang } from './i18n';
import { joinServer, net, savedAuth, savedName, login, register, logout } from './net';
import { renderInventory, renderHotbar } from './ui';
import { renderBuildCards } from './builder';
import { audio, sndClick } from './audio';
import { settings, applySettings } from './settings';

const $ = (id: string) => document.getElementById(id)!;

const nameInput = $('nameinput') as HTMLInputElement;
const accUser = $('accuser') as HTMLInputElement;
const accPass = $('accpass') as HTMLInputElement;

nameInput.value = savedAuth()?.username || savedName();

// ---- splash text vàng kiểu Minecraft ----
const SPLASHES: Record<Lang, string[]> = {
  en: [
    'Also in Vietnamese!', '100% TypeScript!', 'Dig deep for diamonds!',
    'Watch out for creepers!', 'Now with Nether!', 'Three.js powered!',
    'Multiplayer up to 10!', 'Build with AI!', 'Ride the horses!',
    'Free forever!', 'Punch the trees!', 'Beware of lava!',
  ],
  vi: [
    'Có tiếng Việt!', '100% TypeScript!', 'Đào sâu tìm kim cương!',
    'Coi chừng creeper!', 'Đã có Nether!', 'Chạy bằng Three.js!',
    'Chơi chung 10 người!', 'Xây nhà bằng AI!', 'Cưỡi ngựa đi chơi!',
    'Miễn phí mãi mãi!', 'Đấm cây lấy gỗ!', 'Cẩn thận dung nham!',
  ],
};
function rollSplash(): void {
  const list = SPLASHES[lang];
  $('splash').textContent = list[Math.floor(Math.random() * list.length)];
}

// ---- áp chữ theo ngôn ngữ ----
function applyTexts(): void {
  $('ctrl1').innerHTML = t('controlsMove');
  $('ctrl2').innerHTML = t('controlsMouse');
  $('ctrl3').innerHTML = t('controlsHotbar');
  $('ctrl4').innerHTML = t('controlsMobs');
  $('playbtn').textContent = t('clickToPlay');
  nameInput.placeholder = t('yourName');
  $('invtitle').textContent = t('invTitle');
  $('buildtitle').textContent = t('buildTitle');
  $('deathtitle').textContent = t('died');
  $('respawnbtn').textContent = t('respawn');
  $('savestate').textContent = t('saved');
  $('accounthead').textContent = t('account');
  accUser.placeholder = t('username');
  accPass.placeholder = t('password');
  $('loginbtn').textContent = t('login');
  $('registerbtn').textContent = t('register');
  $('logoutbtn').textContent = t('logout');
  $('guesthint').textContent = t('guestHint');
  document.querySelectorAll('#langtoggle span').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-lang') === lang);
  });
  refreshAccountBox();
}

function refreshAccountBox(): void {
  const auth = savedAuth();
  $('accountforms').style.display = auth ? 'none' : 'flex';
  $('accloggedin').style.display = auth ? 'flex' : 'none';
  if (auth) $('accwho').textContent = `${t('loggedInAs')} ${auth.username}`;
}

// ---- chuyển ngôn ngữ ----
$('langtoggle').addEventListener('click', (e) => {
  const l = (e.target as HTMLElement).getAttribute('data-lang') as Lang | null;
  if (l && l !== lang) setLang(l);
});
i18nEvents.addEventListener('change', () => {
  applyTexts();
  rollSplash();
  refreshSettingsUI();
  renderInventory();
  renderHotbar();
  renderBuildCards();
});

// ---- tài khoản ----
async function doAuth(kind: 'login' | 'register'): Promise<void> {
  const st = $('accstatus');
  st.textContent = '…';
  const res = await (kind === 'login' ? login : register)(accUser.value.trim(), accPass.value);
  if (res.ok) {
    st.textContent = '';
    nameInput.value = savedAuth()!.username;
    refreshAccountBox();
  } else {
    const key = res.error === 'taken' ? 'errTaken'
      : res.error === 'invalid' ? 'errInvalid'
      : res.error === 'bad_username' ? 'errBadName'
      : res.error === 'bad_password' ? 'errBadPassword' : 'errNetwork';
    st.textContent = t(key);
  }
}
$('loginbtn').addEventListener('click', () => void doAuth('login'));
$('registerbtn').addEventListener('click', () => void doAuth('register'));
$('logoutbtn').addEventListener('click', () => { logout(); refreshAccountBox(); });

// ---- cài đặt ----
function refreshSettingsUI(): void {
  $('settingsbtn').textContent = t('settings');
  $('settingshead').textContent = t('settingsTitle');
  $('sethud').textContent = `${t('showHudInfo')}: ${settings.showHud ? t('on') : t('off')}`;
  $('setfancy').textContent = `${t('fancyGraphics')}: ${settings.fancy ? t('on') : t('off')}`;
  $('setfancyhint').textContent = t('fancyHint');
}
$('settingsbtn').addEventListener('click', () => {
  const box = $('settingsbox');
  box.style.display = box.style.display === 'none' ? 'flex' : 'none';
  sndClick();
});
$('sethud').addEventListener('click', () => {
  settings.showHud = !settings.showHud;
  applySettings(); refreshSettingsUI(); sndClick();
});
$('setfancy').addEventListener('click', () => {
  settings.fancy = !settings.fancy;
  applySettings(); refreshSettingsUI(); sndClick();
});

// đừng để click vào form kích hoạt pointer lock
$('joinbox').addEventListener('click', (e) => e.stopPropagation());

// ---- chơi ----
$('playbtn').addEventListener('click', () => {
  audio();
  if (!net.joined) joinServer(nameInput.value.trim() || savedAuth()?.username || '');
  canvas.requestPointerLock();
});
nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') ($('playbtn') as HTMLElement).click();
  e.stopPropagation();
});

// trạng thái server đầy
setInterval(() => {
  $('joinstatus').textContent = net.full ? t('serverFull') : '';
}, 600);

applyTexts();
rollSplash();
refreshSettingsUI();
