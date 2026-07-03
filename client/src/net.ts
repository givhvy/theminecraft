// Mạng: kết nối server authoritative (WebSocket), đồng bộ block + vị trí + dimension
import { world, worldManager, switchWorldDimension, getCurrentDimension, type EditMap } from '@shared/world';
import { CHUNK } from '@shared/config';
import type { DimensionId } from '@shared/dimensions';
import { showSaved } from './ui';
import { remotePlayers, RemotePlayer, type RemoteInfo } from './players';
import { hotbarItems, sanitizeItem, type Item } from './ui';

interface PlayersItem { id: string; x: number; y: number; z: number; yaw: number; pitch: number; ride: string | null; dimension?: string }
type ServerMsg =
  | { type: 'welcome'; id: string; slot: number; name: string; registered: boolean; edits: EditMap; editsNether?: EditMap; players: RemoteInfo[] }
  | { type: 'full'; max: number }
  | { type: 'joined'; p: RemoteInfo }
  | { type: 'left'; id: string }
  | { type: 'players'; list: PlayersItem[] }
  | { type: 'init'; edits: EditMap; dimension?: string }
  | { type: 'setBlock'; x: number; y: number; z: number; id: number; dimension?: string };

const LS_WORLD = 'theminecraft_world';
const LS_WORLD_NETHER = 'theminecraft_world_nether';
const LS_AUTH = 'theminecraft_auth';
const LS_NAME = 'theminecraft_name';
const LS_HOTBAR = 'theminecraft_hotbar';

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

function localEdits(dim: DimensionId): EditMap {
  const key = dim === 'nether' ? LS_WORLD_NETHER : LS_WORLD;
  try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
}

export function markAllChunksDirty(): void {
  for (const c of world.chunks.values()) c.dirty = true;
}

function applyRemoteEdit(x: number, y: number, z: number, id: number, dim: DimensionId): void {
  const w = worldManager.worlds[dim];
  w.setBlock(x, y, z, id, false);
  const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
  const ck = cx + ',' + cz;
  (w.editsByChunk[ck] = w.editsByChunk[ck] || {})[`${x - cx * CHUNK},${y},${z - cz * CHUNK}`] = id;
}

function clearRemotePlayers(): void {
  for (const p of remotePlayers.values()) p.remove();
  remotePlayers.clear();
}

export function loadLocalWorld(): void {
  worldManager.worlds.overworld.editsByChunk = localEdits('overworld');
  worldManager.worlds.nether.editsByChunk = localEdits('nether');
  try {
    const hb = JSON.parse(localStorage.getItem(LS_HOTBAR) || 'null');
    if (Array.isArray(hb) && hb.length === 9) {
      for (let i = 0; i < 9; i++) hotbarItems[i] = sanitizeItem(hb[i], hotbarItems[i]);
    }
  } catch { /* noop */ }
}

export async function loadPlayerStateFromServer(): Promise<void> {
  const auth = savedAuth();
  if (!auth?.token) return;
  try {
    const r = await fetch('/api/player-state', { headers: { Authorization: `Bearer ${auth.token}` } });
    if (!r.ok) return;
    const data = await r.json();
    if (Array.isArray(data.hotbar) && data.hotbar.length === 9) {
      for (let i = 0; i < 9; i++) hotbarItems[i] = sanitizeItem(data.hotbar[i], hotbarItems[i]);
    }
  } catch { /* noop */ }
}

export function savePlayerStateToServer(x: number, y: number, z: number): void {
  const auth = savedAuth();
  if (!auth?.token) return;
  fetch('/api/player-state', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ dimension: getCurrentDimension(), x, y, z, hotbar: hotbarItems }),
  }).catch(() => { /* noop */ });
}

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
    if (wasJoined) markAllChunksDirty();
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
    const mine = worldManager.worlds.overworld.editsByChunk;
    const mineNether = worldManager.worlds.nether.editsByChunk;
    const serverEmpty = Object.keys(msg.edits).length === 0;
    if (serverEmpty && Object.keys(mine).length > 0) {
      ws!.send(JSON.stringify({ type: 'seed', edits: mine, dimension: 'overworld' }));
    } else {
      worldManager.worlds.overworld.editsByChunk = msg.edits;
    }
    if (msg.editsNether) {
      const netherEmpty = Object.keys(msg.editsNether).length === 0;
      if (netherEmpty && Object.keys(mineNether).length > 0) {
        ws!.send(JSON.stringify({ type: 'seed', edits: mineNether, dimension: 'nether' }));
      } else {
        worldManager.worlds.nether.editsByChunk = msg.editsNether;
      }
    }
    markAllChunksDirty();
    clearRemotePlayers();
    for (const p of msg.players) remotePlayers.set(p.id, new RemotePlayer(p));
    loadPlayerStateFromServer();
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
      remotePlayers.get(it.id)?.setLatest(it); // tab cộng đồng thấy mọi dimension
      if (it.dimension && it.dimension !== getCurrentDimension()) continue;
      remotePlayers.get(it.id)?.push(it);
    }
  } else if (msg.type === 'init') {
    const dim = (msg.dimension === 'nether' ? 'nether' : 'overworld') as DimensionId;
    worldManager.worlds[dim].editsByChunk = msg.edits;
    if (dim === getCurrentDimension()) markAllChunksDirty();
  } else if (msg.type === 'setBlock') {
    const dim = (msg.dimension === 'nether' ? 'nether' : 'overworld') as DimensionId;
    applyRemoteEdit(msg.x, msg.y, msg.z, msg.id, dim);
    if (dim === getCurrentDimension()) markAllChunksDirty();
  }
}

let lastPosSend = 0;
export function sendPos(x: number, y: number, z: number, yaw: number, pitch: number, ride: string | null): void {
  if (!isConnected() || !ws || ws.readyState !== WebSocket.OPEN) return;
  const now = performance.now();
  if (now - lastPosSend < 50) return;
  lastPosSend = now;
  ws.send(JSON.stringify({ type: 'pos', x, y, z, yaw, pitch, ride, dimension: getCurrentDimension() }));
}

for (const w of Object.values(worldManager.worlds)) {
  w.onEdit = (x, y, z, id) => {
    if (isConnected() && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'setBlock', x, y, z, id, dimension: w.dimension }));
    }
  };
}

setInterval(() => {
  let saved = false;
  for (const [dim, w] of Object.entries(worldManager.worlds) as [DimensionId, typeof world][]) {
    if (!w.pendingSave) continue;
    w.pendingSave = false;
    const key = dim === 'nether' ? LS_WORLD_NETHER : LS_WORLD;
    localStorage.setItem(key, JSON.stringify(w.editsByChunk));
    saved = true;
  }
  if (saved) {
    localStorage.setItem(LS_HOTBAR, JSON.stringify(hotbarItems));
    showSaved();
  }
}, 10000);

let lastStateSave = 0;
export function tickPlayerStateSave(x: number, y: number, z: number): void {
  const now = performance.now();
  if (now - lastStateSave < 30000) return;
  lastStateSave = now;
  savePlayerStateToServer(x, y, z);
}
