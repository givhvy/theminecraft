// Đồng bộ world với server qua WebSocket (server authoritative)
// Fallback localStorage khi không có server (mở file tĩnh)
import { world } from '@shared/world';
import { showSaved } from './ui';

type ServerMsg =
  | { type: 'init'; edits: Record<string, Record<string, number>> }
  | { type: 'setBlock'; x: number; y: number; z: number; id: number };

let ws: WebSocket | null = null;
let connected = false;
export function isConnected(): boolean { return connected; }

const LS_KEY = 'theminecraft_world';

function applyRemoteEdit(x: number, y: number, z: number, id: number): void {
  // áp dụng edit từ server mà không gửi ngược lại
  world.setBlock(x, y, z, id, false);
  // vẫn ghi vào editsByChunk để chunk chưa sinh sẽ áp dụng đúng
  const cx = Math.floor(x / 16), cz = Math.floor(z / 16);
  const ck = cx + ',' + cz;
  (world.editsByChunk[ck] = world.editsByChunk[ck] || {})[`${x - cx * 16},${y},${z - cz * 16}`] = id;
}

export function connect(): Promise<void> {
  return new Promise((resolve) => {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    let settled = false;
    const settle = () => { if (!settled) { settled = true; resolve(); } };
    try {
      ws = new WebSocket(`${proto}//${location.host}/ws`);
    } catch {
      loadLocal(); settle(); return;
    }
    const timeout = setTimeout(() => { loadLocal(); settle(); }, 4000);
    ws.onmessage = (ev) => {
      let msg: ServerMsg;
      try { msg = JSON.parse(ev.data as string); } catch { return; }
      if (msg.type === 'init') {
        world.editsByChunk = msg.edits || {};
        connected = true;
        clearTimeout(timeout);
        settle();
      } else if (msg.type === 'setBlock') {
        applyRemoteEdit(msg.x, msg.y, msg.z, msg.id);
      }
    };
    ws.onerror = () => { clearTimeout(timeout); loadLocal(); settle(); };
    ws.onclose = () => { connected = false; };
  });
}

function loadLocal(): void {
  try {
    world.editsByChunk = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch { world.editsByChunk = {}; }
}

// gửi mọi edit của người chơi lên server
world.onEdit = (x, y, z, id) => {
  if (connected && ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'setBlock', x, y, z, id }));
  }
};

// fallback: autosave localStorage khi không có server
setInterval(() => {
  if (connected) {
    if (world.pendingSave) { world.pendingSave = false; showSaved(); }
    return;
  }
  if (!world.pendingSave) return;
  world.pendingSave = false;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(world.editsByChunk));
    showSaved();
  } catch { /* hết dung lượng */ }
}, 10000);
