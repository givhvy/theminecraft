// 🤖 AI Builder: menu chọn công trình + xây dần từng block trước mặt người chơi
import { AIR } from './blocks.js';
import { world } from './world.js';
import { player } from './player.js';
import { STRUCTURES } from './structures.js';
import { buildInfoEl, uiEvents } from './ui.js';
import { sndOpen, sndClose, sndClick, sndBuildTick, sndBuildDone } from './audio.js';

export let builderOpen = false;
const builderEl = document.getElementById('builder');
const buildGrid = document.getElementById('buildgrid');

// hàng đợi xây: mỗi phần tử [wx, wy, wz, id]
let buildQueue = [];
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

export function toggleBuilder() {
  builderOpen = !builderOpen;
  builderEl.style.display = builderOpen ? 'block' : 'none';
  builderOpen ? sndOpen() : sndClose();
  uiEvents.dispatchEvent(new Event(builderOpen ? 'modalopen' : 'modalclose'));
}

// xoay toạ độ cục bộ theo hướng nhìn (4 hướng chính)
function rotateXZ(x, z, rot) {
  switch (rot) {
    case 0: return [x, z];
    case 1: return [z, -x];
    case 2: return [-x, -z];
    default: return [-z, x];
  }
}

function startBuild(struct) {
  const blocks = struct.gen();
  // vector forward của người chơi → hướng cardinal (local +z hướng ra xa người chơi)
  const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw);
  const cf = Math.abs(fx) > Math.abs(fz)
    ? [Math.sign(fx), 0]
    : [0, Math.sign(fz)];
  // gốc công trình: cách người chơi 5 block theo hướng nhìn
  const ox = Math.floor(player.pos.x + cf[0] * 5);
  const oz = Math.floor(player.pos.z + cf[1] * 5);
  // độ cao nền: block đặc cao nhất tại gốc
  const oy = world.topSolidY(ox, oz) + 1;

  // ánh xạ local (x,z) → world theo hướng: local +z = hướng forward
  const mapXZ = (lx, lz) => {
    if (cf[0] === 1) return [ox + lz, oz + lx];        // +x
    if (cf[0] === -1) return [ox - lz, oz - lx];       // -x
    if (cf[1] === 1) return [ox - lx, oz + lz];        // +z
    return [ox + lx, oz - lz];                          // -z
  };

  // dedupe theo toạ độ — block đặt sau thắng (để "khoét cửa" bằng AIR hoạt động đúng)
  const cells = new Map();
  const footprint = new Set();
  for (const [lx, ly, lz, id] of blocks) {
    const [wx, wz] = mapXZ(lx, lz);
    cells.set(wx + ',' + (oy + ly) + ',' + wz, [wx, oy + ly, wz, id]);
    if (ly === 0 && id !== AIR) footprint.add(wx + ',' + wz);
  }
  // nền móng: lấp trụ xuống đất dưới mỗi ô sàn
  for (const key of footprint) {
    const [wx, wz] = key.split(',').map(Number);
    for (let y = oy - 1; y > 0; y--) {
      if (world.isSolid(wx, y, wz)) break;
      cells.set(wx + ',' + y + ',' + wz, [wx, y, wz, 10]); // đá cuội làm móng
    }
  }
  const queue = [...cells.values()];
  // xây từ thấp lên cao, lan từ tâm ra ngoài cho đẹp mắt
  queue.sort((a, b) => (a[1] - b[1]) || ((Math.abs(a[0] - ox) + Math.abs(a[2] - oz)) - (Math.abs(b[0] - ox) + Math.abs(b[2] - oz))));

  buildQueue = queue;
  buildTotal = queue.length;
  buildName = struct.name;
}

export function updateBuilder(dt) {
  if (buildQueue.length === 0) {
    buildInfoEl.textContent = '';
    return;
  }
  // tốc độ xây tỉ lệ với kích thước công trình (xây xong trong ~8 giây)
  const perSecond = Math.max(60, buildTotal / 8);
  let n = Math.max(1, Math.round(perSecond * dt));
  tickAcc += dt;
  while (n-- > 0 && buildQueue.length > 0) {
    const [x, y, z, id] = buildQueue.shift();
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
