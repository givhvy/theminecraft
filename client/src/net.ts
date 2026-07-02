// Mạng: kết nối server authoritative (WebSocket), đồng bộ block + vị trí người chơi
// - Tự kết nối lại khi rớt mạng (backoff)
// - Fallback localStorage khi không có server; seed lại world cho server trống (Vercel cold start)
import { world, type EditMap } from '@shared/world';
import { CHUNK } from '@shared/config';
import { showSaved } from './ui';
import { remotePlayers, RemotePlayer, type RemoteInfo } from './players';

interface PlayersItem { id: string; x: number; y: number; z: number; yaw: number; pitch: number; ride: string | null }
type ServerMsg =
  | { type: 'welcome'; id: string; slot: number; name: string; registered: boolean; edits: EditMap; players: RemoteInfo[] }
  | { type: 'full'; max: number }
  | { type: 'joined'; p: RemoteInfo }
  | { type: 'left'; id: string }
  | { type: 'players'; list: PlayersItem[] }
  | { type: 'init'; edits: EditMap }
  | { type: 'setBlock'; x: number; y: number; z: number; id: number };

const LS_WORLD = 'theminecraft_world';
const LS_AUTH = 'theminecraft_auth';
const LS_NAME = 'theminecraft_name';

export const net = {
  connected: false,
  joined: false,
  full: false,
  id: '',
  slot: 0,
  name: '',
  registered: false,
};
export function isConnected(): boolean { return net.connected && net.joined; }
export function playerCount(): number { return remotePlayers.size + (net.joined ? 1 : 0); }

let ws: WebSocket | null = null;
let wantJoin = false;
let retryDelay = 1000;

// ---- tài khoản ----
export function savedAuth(): { token: string; username: string } | null {
  try { return JSON.parse(localStorage.getItem(LS_AUTH) || 'null'); } catch { return null; }
}
export function savedName(): string { return localStorage.getItem(LS_NAME) || ''; }

async function authRequest(path: string, username: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const r = await fetch(path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: (data as { error?: string }).error || 'errNetwork' };
    localStorage.setItem(LS_AUTH, JSON.stringify(data));
    return { ok: true };
  } catch { return { ok: false, error: 'errNetwork' }; }
}
export const register = (u: string, p: string) => authRequest('/api/register', u, p);
export const login = (u: string, p: string) => authRequest('/api/login', u, p);
export function logout(): void { localStorage.removeItem(LS_AUTH); }

// ---- world helpers ----
function localEdits(): EditMap {
  try { return JSON.parse(localStorage.getItem(LS_WORLD) || '{}'); } catch { return {}; }
}
function markAllChunksDirty(): void {
  for (const c of world.chunks.values()) c.dirty = true;
}
function applyRemoteEdit(x: number, y: number, z: number, id: number): void {
  world.setBlock(x, y, z, id, false);
  const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
  const ck = cx + ',' + cz;
  (world.editsByChunk[ck] = world.editsByChunk[ck] || {})[`${x - cx * CHUNK},${y},${z - cz * CHUNK}`] = id;
}

function clearRemotePlayers(): void {
  for (const p of remotePlayers.values()) p.remove();
  remotePlayers.clear();
}

// ---- chơi offline ngay từ đầu (backdrop + fallback) ----
export function loadLocalWorld(): void {
  world.editsByChunk = localEdits();
}

// ---- kết nối + join ----
export function joinServer(name: string): void {
  net.full = false;
  wantJoin = true;
  localStorage.setItem(LS_NAME, name);
  openSocket(name);
}

function openSocket(name: string): void {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  try {
    ws = new WebSocket(`${proto}//${location.host}/ws`);
  } catch { scheduleRetry(name); return; }

  ws.onopen = () => {
    retryDelay = 1000;
    const auth = savedAuth();
    ws!.send(JSON.stringify({ type: 'join', name, token: auth?.token }));
  };
  ws.onmessage = (ev) => {
    let msg: ServerMsg;
    try { msg = JSON.parse(ev.data as string); } catch { return; }
    handleMsg(msg);
  };
  ws.onclose = () => {
    const wasJoined = net.joined;
    net.connected = false;
    net.joined = false;
    clearRemotePlayers();
    if (wantJoin && !net.full) scheduleRetry(name);
    if (wasJoined) markAllChunksDirty(); // không cần nhưng giữ world hiển thị nhất quán
  };
  ws.onerror = () => { try { ws?.close(); } catch { /* noop */ } };
}

function scheduleRetry(name: string): void {
  setTimeout(() => { if (wantJoin) openSocket(name); }, retryDelay);
  retryDelay = Math.min(retryDelay * 2, 15000);
}

function handleMsg(msg: ServerMsg): void {
  if (msg.type === 'welcome') {
    net.connected = true; net.joined = true;
    net.id = msg.id; net.slot = msg.slot; net.name = msg.name; net.registered = msg.registered;
    const mine = world.editsByChunk;
    const serverEmpty = Object.keys(msg.edits).length === 0;
    if (serverEmpty && Object.keys(mine).length > 0) {
      // server trống (cold start) → gửi bản thế giới local lên khôi phục
      ws!.send(JSON.stringify({ type: 'seed', edits: mine }));
    } else {
      world.editsByChunk = msg.edits;
      markAllChunksDirty();
    }
    clearRemotePlayers();
    for (const p of msg.players) remotePlayers.set(p.id, new RemotePlayer(p));
  } else if (msg.type === 'full') {
    net.full = true;
    wantJoin = false;
  } else if (msg.type === 'joined') {
    if (!remotePlayers.has(msg.p.id)) remotePlayers.set(msg.p.id, new RemotePlayer(msg.p));
  } else if (msg.type === 'left') {
    remotePlayers.get(msg.id)?.remove();
    remotePlayers.delete(msg.id);
  } else if (msg.type === 'players') {
    for (const it of msg.list) {
      if (it.id === net.id) continue;
      remotePlayers.get(it.id)?.push(it);
    }
  } else if (msg.type === 'init') {
    world.editsByChunk = msg.edits;
    markAllChunksDirty();
  } else if (msg.type === 'setBlock') {
    applyRemoteEdit(msg.x, msg.y, msg.z, msg.id);
  }
}

// ---- gửi vị trí (throttle ~20Hz) ----
let lastPosSend = 0;
export function sendPos(x: number, y: number, z: number, yaw: number, pitch: number, ride: string | null): void {
  if (!isConnected() || !ws || ws.readyState !== WebSocket.OPEN) return;
  const now = performance.now();
  if (now - lastPosSend < 50) return;
  lastPosSend = now;
  ws.send(JSON.stringify({ type: 'pos', x, y, z, yaw, pitch, ride }));
}

// ---- gửi edit của người chơi ----
world.onEdit = (x, y, z, id) => {
  if (isConnected() && ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'setBlock', x, y, z, id }));
  }
};

// ---- mirror localStorage (luôn luôn — vừa là offline save vừa là nguồn seed) ----
setInterval(() => {
  if (!world.pendingSave) return;
  world.pendingSave = false;
  try {
    localStorage.setItem(LS_WORLD, JSON.stringify(world.editsByChunk));
    showSaved();
  } catch { /* hết dung lượng */ }
}, 10000);
