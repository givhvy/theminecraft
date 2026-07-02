// Màn hình chính: nhập tên, tài khoản (tuỳ chọn), chuyển ngôn ngữ, nút chơi
import { canvas } from './scene';
import { t, lang, setLang, i18nEvents, type Lang } from './i18n';
import { joinServer, net, savedAuth, savedName, login, register, logout } from './net';
import { renderInventory, renderHotbar } from './ui';
import { renderBuildCards } from './builder';
import { audio } from './audio';

const $ = (id: string) => document.getElementById(id)!;

const nameInput = $('nameinput') as HTMLInputElement;
const accUser = $('accuser') as HTMLInputElement;
const accPass = $('accpass') as HTMLInputElement;

nameInput.value = savedAuth()?.username || savedName();

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
