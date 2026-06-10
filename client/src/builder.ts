// 🤖 AI Builder: menu chọn công trình + xây dần từng block
import { AIR } from '@shared/blocks';
import { world } from '@shared/world';
import { STRUCTURES, type Structure } from '@shared/structures';
import { player } from './player';
import { buildInfoEl, uiEvents } from './ui';
import { sndOpen, sndClose, sndClick, sndBuildTick, sndBuildDone } from './audio';

export let builderOpen = false;
const builderEl = document.getElementById('builder')!;
const buildGrid = document.getElementById('buildgrid')!;

type QueuedBlock = [number, number, number, number];
let buildQueue: QueuedBlock[] = [];
let buildTotal = 0;
let buildName = '';
let tickAcc = 0;

for (const s of STRUCTURES) {
  const card = document.createElement('div');
  card.className = 'buildcard';
  card.innerHTML = `<div class="emoji">${s.emoji}</div><div class="name">${s.name}</div><div class="desc">${s.desc}</div>`;
  card.addEventListener('click', () => {
    sndClick();
    startBuild(s);
    toggleBuilder();
  });
  buildGrid.appendChild(card);
}

export function toggleBuilder(): void {
  builderOpen = !builderOpen;
  builderEl.style.display = builderOpen ? 'block' : 'none';
  builderOpen ? sndOpen() : sndClose();
  uiEvents.dispatchEvent(new Event(builderOpen ? 'modalopen' : 'modalclose'));
}

function startBuild(struct: Structure): void {
  const blocks = struct.gen();
  // hướng nhìn → hướng cardinal (local +z = ra xa người chơi)
  const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw);
  const cf: [number, number] = Math.abs(fx) > Math.abs(fz)
    ? [Math.sign(fx), 0]
    : [0, Math.sign(fz)];
  const ox = Math.floor(player.pos.x + cf[0] * 5);
  const oz = Math.floor(player.pos.z + cf[1] * 5);
  const oy = world.topSolidY(ox, oz) + 1;

  const mapXZ = (lx: number, lz: number): [number, number] => {
    if (cf[0] === 1) return [ox + lz, oz + lx];
    if (cf[0] === -1) return [ox - lz, oz - lx];
    if (cf[1] === 1) return [ox - lx, oz + lz];
    return [ox + lx, oz - lz];
  };

  // dedupe theo toạ độ — block đặt sau thắng (để khoét cửa bằng AIR đúng)
  const cells = new Map<string, QueuedBlock>();
  const footprint = new Set<string>();
  for (const [lx, ly, lz, id] of blocks) {
    const [wx, wz] = mapXZ(lx, lz);
    cells.set(wx + ',' + (oy + ly) + ',' + wz, [wx, oy + ly, wz, id]);
    if (ly === 0 && id !== AIR) footprint.add(wx + ',' + wz);
  }
  // nền móng đá cuội xuống tới đất
  for (const key of footprint) {
    const [wx, wz] = key.split(',').map(Number);
    for (let y = oy - 1; y > 0; y--) {
      if (world.isSolid(wx, y, wz)) break;
      cells.set(wx + ',' + y + ',' + wz, [wx, y, wz, 10]);
    }
  }
  const queue = [...cells.values()];
  queue.sort((a, b) => (a[1] - b[1]) || ((Math.abs(a[0] - ox) + Math.abs(a[2] - oz)) - (Math.abs(b[0] - ox) + Math.abs(b[2] - oz))));

  buildQueue = queue;
  buildTotal = queue.length;
  buildName = struct.name;
}

export function updateBuilder(dt: number): void {
  if (buildQueue.length === 0) return;
  const perSecond = Math.max(60, buildTotal / 8);
  let n = Math.max(1, Math.round(perSecond * dt));
  tickAcc += dt;
  while (n-- > 0 && buildQueue.length > 0) {
    const [x, y, z, id] = buildQueue.shift()!;
    world.setBlock(x, y, z, id);
  }
  if (tickAcc > 0.09) { tickAcc = 0; sndBuildTick(); }
  const done = buildTotal - buildQueue.length;
  buildInfoEl.textContent = `🤖 Đang xây ${buildName}… ${Math.round(done / buildTotal * 100)}%`;
  if (buildQueue.length === 0) {
    buildInfoEl.textContent = `✅ Đã xây xong ${buildName}!`;
    sndBuildDone();
    setTimeout(() => { if (buildQueue.length === 0) buildInfoEl.textContent = ''; }, 3000);
  }
}
