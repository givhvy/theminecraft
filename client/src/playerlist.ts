// Tab cộng đồng: giữ Tab để xem người chơi online đang làm gì (như Minecraft)
import { remotePlayers, SLOT_COLORS } from './players';
import { net, isConnected } from './net';
import { player } from './player';
import { t } from './i18n';

const el = document.getElementById('playerlist')!;
let visible = false;
let refreshTimer = 0;

function hex(c: number): string { return '#' + c.toString(16).padStart(6, '0'); }

function activityOf(ride: string | null, moving: boolean, dimension: string): string {
  if (ride === 'horse') return t('actRiding');
  if (ride === 'boat') return t('actBoating');
  if (dimension === 'nether') return t('actNether');
  return moving ? t('actExploring') : t('actIdle');
}

function render(): void {
  const rows: string[] = [];
  rows.push(`<div class="plhead">${t('playersTitle')} — ${isConnected() ? `${remotePlayers.size + 1}/10 🌐` : `1 💾 ${t('local')}`}</div>`);

  // bản thân
  const mySlot = net.joined ? net.slot : 1;
  const myAct = player.riding
    ? (player.riding.rideKind === 'horse' ? t('actRiding') : t('actBoating'))
    : player.flying ? t('actFlying') : t('actExploring');
  rows.push(row(mySlot, `${net.name || 'You'} (${t('you')})`, myAct, ''));

  const now = performance.now() / 1000;
  for (const p of remotePlayers.values()) {
    const l = p.latest;
    if (!l) { rows.push(row(p.info.slot, p.info.name, '…', '')); continue; }
    const moving = !!p.prevLatest && Math.hypot(l.x - p.prevLatest.x, l.z - p.prevLatest.z) / Math.max(l.t - p.prevLatest.t, 0.01) > 0.4;
    const stale = now - l.t > 4;
    const dist = Math.round(Math.hypot(l.x - player.pos.x, l.z - player.pos.z));
    const distLabel = l.dimension === 'nether' ? '🔥 Nether' : `${dist}m`;
    rows.push(row(p.info.slot, p.info.name + (p.info.registered ? ' ✓' : ''), stale ? '…' : activityOf(l.ride, moving, l.dimension), distLabel));
  }
  el.innerHTML = rows.join('');
}

function row(slot: number, name: string, act: string, dist: string): string {
  const color = hex(SLOT_COLORS[(slot - 1) % SLOT_COLORS.length]);
  return `<div class="plrow">
    <span class="plchip" style="background:${color}"></span>
    <span class="plname">P${slot} · ${name}</span>
    <span class="plact">${act}</span>
    <span class="pldist">${dist}</span>
  </div>`;
}

export function showPlayerList(): void {
  if (visible) return;
  visible = true;
  el.style.display = 'block';
  render();
}
export function hidePlayerList(): void {
  visible = false;
  el.style.display = 'none';
}
export function updatePlayerList(dt: number): void {
  if (!visible) return;
  refreshTimer -= dt;
  if (refreshTimer <= 0) { refreshTimer = 0.5; render(); }
}
