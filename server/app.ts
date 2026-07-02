// Server authoritative: world state + multiplayer + Prisma DB
import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HEIGHT, CHUNK } from '../shared/config.js';
import { isValidBlockId } from '../shared/blocks.js';
import { isDimensionId, type DimensionId } from '../shared/dimensions.js';
import { prisma, initDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ON_VERCEL = !!process.env.VERCEL;
const DATA_DIR = ON_VERCEL ? '/tmp/theminecraft' : path.join(__dirname, '..', 'worlds');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const WORLD_LIMIT = 200000;
const MAX_PLAYERS = 10;
const AUTH_SECRET = process.env.AUTH_SECRET || 'theminecraft-game-secret-v1';

try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch { /* read-only fs */ }

type EditMap = Record<string, Record<string, number>>;

// ================= world state (RAM cache + Prisma) =================
const WORLD_NAME = 'default';
/** edits[dimension][chunkKey][localKey] = blockId */
const editsByDim: Record<DimensionId, EditMap> = { overworld: {}, nether: {} };
let editCount = 0;
let dbReady = false;

export async function loadWorldFromDb(): Promise<void> {
  await initDb();
  const rows = await prisma.blockEdit.findMany({ where: { worldName: WORLD_NAME } });
  for (const r of rows) {
    const dim = isDimensionId(r.dimension) ? r.dimension : 'overworld';
    const ck = `${Math.floor(r.x / CHUNK)},${Math.floor(r.z / CHUNK)}`;
    const lk = `${r.x - Math.floor(r.x / CHUNK) * CHUNK},${r.y},${r.z - Math.floor(r.z / CHUNK) * CHUNK}`;
    (editsByDim[dim][ck] = editsByDim[dim][ck] || {})[lk] = r.blockId;
  }
  editCount = rows.length;
  dbReady = true;
}

function editsForDimension(dim: DimensionId): EditMap {
  return editsByDim[dim];
}

function totalEditCount(): number {
  return Object.values(editsByDim).reduce((n, m) =>
    n + Object.values(m).reduce((s, c) => s + Object.keys(c).length, 0), 0);
}

const pendingUpserts: { dimension: DimensionId; x: number; y: number; z: number; blockId: number }[] = [];
let saveTimer: NodeJS.Timeout | null = null;

function scheduleSave(): void {
  if (saveTimer) return;
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    if (!dbReady || pendingUpserts.length === 0) return;
    const batch = pendingUpserts.splice(0, pendingUpserts.length);
    try {
      await prisma.$transaction(
        batch.map(e => prisma.blockEdit.upsert({
          where: { worldName_dimension_x_y_z: { worldName: WORLD_NAME, dimension: e.dimension, x: e.x, y: e.y, z: e.z } },
          create: { worldName: WORLD_NAME, dimension: e.dimension, x: e.x, y: e.y, z: e.z, blockId: e.blockId },
          update: { blockId: e.blockId },
        })),
      );
    } catch { /* noop on Vercel read-only */ }
  }, 3000);
}

function applyEdit(dimension: DimensionId, x: number, y: number, z: number, id: number): boolean {
  if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(z) || !Number.isInteger(id)) return false;
  if (y < 1 || y >= HEIGHT) return false;
  if (Math.abs(x) > 100000 || Math.abs(z) > 100000) return false;
  if (!isValidBlockId(id)) return false;
  if (editCount >= WORLD_LIMIT) return false;
  const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
  const ck = cx + ',' + cz;
  const lk = `${x - cx * CHUNK},${y},${z - cz * CHUNK}`;
  const chunk = (editsByDim[dimension][ck] = editsByDim[dimension][ck] || {});
  if (!(lk in chunk)) editCount++;
  chunk[lk] = id;
  pendingUpserts.push({ dimension, x, y, z, blockId: id });
  scheduleSave();
  return true;
}

// ================= tài khoản (Prisma) =================
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 32).toString('hex');
}
function signToken(username: string): string {
  const payload = Buffer.from(JSON.stringify({ u: username, exp: Date.now() + 365 * 86400e3 })).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  return payload + '.' + sig;
}
export function verifyToken(token: string): string | null {
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expect = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (typeof data.u !== 'string' || Date.now() > data.exp) return null;
    return data.u;
  } catch { return null; }
}
const validName = (s: unknown): s is string => typeof s === 'string' && /^[\wÀ-ɏḀ-ỿ .-]{2,16}$/.test(s);

// ================= người chơi =================
interface Player {
  ws: WebSocket;
  id: string;
  slot: number;
  name: string;
  registered: boolean;
  dimension: DimensionId;
  x: number; y: number; z: number; yaw: number; pitch: number;
  ride: string | null;
  hasPos: boolean;
}
const players = new Map<WebSocket, Player>();

function freeSlot(): number {
  const used = new Set([...players.values()].map(p => p.slot));
  for (let s = 1; s <= MAX_PLAYERS; s++) if (!used.has(s)) return s;
  return -1;
}
function pub(p: Player) {
  return { id: p.id, slot: p.slot, name: p.name, registered: p.registered, dimension: p.dimension };
}
function broadcast(msg: unknown, except?: WebSocket): void {
  const out = JSON.stringify(msg);
  for (const [ws] of players) {
    if (ws !== except && ws.readyState === WebSocket.OPEN) ws.send(out);
  }
}
function broadcastToDimension(dimension: DimensionId, msg: unknown, except?: WebSocket): void {
  const out = JSON.stringify(msg);
  for (const [ws, p] of players) {
    if (p.dimension !== dimension) continue;
    if (ws !== except && ws.readyState === WebSocket.OPEN) ws.send(out);
  }
}

setInterval(() => {
  if (players.size < 2) return;
  for (const dim of ['overworld', 'nether'] as DimensionId[]) {
    const list = [...players.values()].filter(p => p.hasPos && p.dimension === dim)
      .map(p => ({ id: p.id, x: p.x, y: p.y, z: p.z, yaw: p.yaw, pitch: p.pitch, ride: p.ride, dimension: p.dimension }));
    if (list.length === 0) continue;
    for (const [ws, p] of players) {
      if (p.dimension !== dim || ws.readyState !== WebSocket.OPEN) continue;
      ws.send(JSON.stringify({ type: 'players', list }));
    }
  }
}, 66);

// ================= HTTP =================
export const app = express();
app.use(express.json({ limit: '4mb' }));

app.get('/api/world/:name', (req, res) => {
  if (req.params.name !== WORLD_NAME) return res.status(404).json({ error: 'world not found' });
  const dim = isDimensionId(req.query.dimension) ? req.query.dimension : 'overworld';
  res.json({ edits: editsForDimension(dim), dimension: dim });
});

app.get('/api/world/:name/all', (req, res) => {
  if (req.params.name !== WORLD_NAME) return res.status(404).json({ error: 'world not found' });
  res.json({ overworld: editsByDim.overworld, nether: editsByDim.nether });
});

app.get('/api/status', (_req, res) => {
  res.json({ players: players.size, max: MAX_PLAYERS, editCount: totalEditCount(), db: dbReady });
});

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body || {};
  if (!validName(username)) return res.status(400).json({ error: 'bad_username' });
  if (typeof password !== 'string' || password.length < 4) return res.status(400).json({ error: 'bad_password' });
  const key = username.toLowerCase();
  try {
    const existing = await prisma.account.findUnique({ where: { username: key } });
    if (existing) return res.status(409).json({ error: 'taken' });
    const salt = crypto.randomBytes(16).toString('hex');
    await prisma.account.create({ data: { username: key, salt, hash: hashPassword(password, salt) } });
    res.json({ token: signToken(username), username });
  } catch { res.status(500).json({ error: 'db_error' }); }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!validName(username) || typeof password !== 'string') return res.status(400).json({ error: 'bad_request' });
  try {
    const acc = await prisma.account.findUnique({ where: { username: username.toLowerCase() } });
    if (!acc || hashPassword(password, acc.salt) !== acc.hash) return res.status(401).json({ error: 'invalid' });
    res.json({ token: signToken(username), username });
  } catch { res.status(500).json({ error: 'db_error' }); }
});

app.get('/api/player-state', async (req, res) => {
  const auth = req.headers.authorization?.replace(/^Bearer\s+/i, '') || '';
  const u = verifyToken(auth);
  if (!u) return res.status(401).json({ error: 'unauthorized' });
  try {
    const state = await prisma.playerState.findUnique({ where: { username: u.toLowerCase() } });
    if (!state) return res.json({ dimension: 'overworld', x: 0, y: 20, z: 0, hotbar: [] });
    res.json({
      dimension: state.dimension,
      x: state.x, y: state.y, z: state.z,
      hotbar: JSON.parse(state.hotbar || '[]'),
    });
  } catch { res.status(500).json({ error: 'db_error' }); }
});

app.put('/api/player-state', async (req, res) => {
  const auth = req.headers.authorization?.replace(/^Bearer\s+/i, '') || '';
  const u = verifyToken(auth);
  if (!u) return res.status(401).json({ error: 'unauthorized' });
  const { dimension, x, y, z, hotbar } = req.body || {};
  const dim = isDimensionId(dimension) ? dimension : 'overworld';
  try {
    await prisma.playerState.upsert({
      where: { username: u.toLowerCase() },
      create: {
        username: u.toLowerCase(),
        dimension: dim,
        x: Number(x) || 0, y: Number(y) || 20, z: Number(z) || 0,
        hotbar: JSON.stringify(hotbar || []),
      },
      update: {
        dimension: dim,
        x: Number(x) || 0, y: Number(y) || 20, z: Number(z) || 0,
        hotbar: JSON.stringify(hotbar || []),
      },
    });
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'db_error' }); }
});

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
}

export const server = createServer(app);

// ================= WebSocket =================
const wss = new WebSocketServer({ server });

type ClientMsg =
  | { type: 'join'; name?: string; token?: string }
  | { type: 'setBlock'; x: number; y: number; z: number; id: number; dimension?: string }
  | { type: 'pos'; x: number; y: number; z: number; yaw: number; pitch: number; ride?: string | null; dimension?: string }
  | { type: 'seed'; edits: EditMap; dimension?: string };

wss.on('connection', (ws) => {
  let me: Player | null = null;

  ws.on('message', (raw) => {
    let msg: ClientMsg;
    try { msg = JSON.parse(String(raw)); } catch { return; }

    if (msg.type === 'join') {
      if (me) return;
      const slot = freeSlot();
      if (slot === -1) {
        ws.send(JSON.stringify({ type: 'full', max: MAX_PLAYERS }));
        ws.close();
        return;
      }
      let name = validName(msg.name) ? msg.name.trim() : '';
      let registered = false;
      if (typeof msg.token === 'string') {
        const u = verifyToken(msg.token);
        if (u) { name = u; registered = true; }
      }
      if (!name) name = 'Player ' + slot;
      me = {
        ws, id: crypto.randomBytes(6).toString('hex'), slot, name, registered,
        dimension: 'overworld',
        x: 0, y: 0, z: 0, yaw: 0, pitch: 0, ride: null, hasPos: false,
      };
      players.set(ws, me);
      ws.send(JSON.stringify({
        type: 'welcome', id: me.id, slot, name, registered,
        edits: editsByDim.overworld,
        editsNether: editsByDim.nether,
        players: [...players.values()].filter(p => p !== me).map(pub),
      }));
      broadcast({ type: 'joined', p: pub(me) }, ws);
      return;
    }

    if (!me) return;

    if (msg.type === 'setBlock') {
      const dim: DimensionId = isDimensionId(msg.dimension) ? msg.dimension : me.dimension;
      const { x, y, z, id } = msg;
      if (!applyEdit(dim, x, y, z, id)) return;
      broadcastToDimension(dim, { type: 'setBlock', x, y, z, id, dimension: dim }, ws);
    } else if (msg.type === 'pos') {
      if (![msg.x, msg.y, msg.z, msg.yaw, msg.pitch].every(Number.isFinite)) return;
      me.x = msg.x; me.y = msg.y; me.z = msg.z; me.yaw = msg.yaw; me.pitch = msg.pitch;
      me.ride = msg.ride === 'horse' || msg.ride === 'boat' ? msg.ride : null;
      if (isDimensionId(msg.dimension)) me.dimension = msg.dimension;
      me.hasPos = true;
    } else if (msg.type === 'seed') {
      const dim: DimensionId = isDimensionId(msg.dimension) ? msg.dimension : 'overworld';
      const dimEdits = editsByDim[dim];
      const dimCount = Object.values(dimEdits).reduce((n, c) => n + Object.keys(c).length, 0);
      if (dimCount > 0 || typeof msg.edits !== 'object' || !msg.edits) return;
      let applied = 0;
      for (const ck in msg.edits) {
        const m = /^(-?\d+),(-?\d+)$/.exec(ck);
        if (!m) continue;
        const cx = Number(m[1]), cz = Number(m[2]);
        for (const lk in msg.edits[ck]) {
          const lm = /^(\d+),(\d+),(\d+)$/.exec(lk);
          if (!lm) continue;
          const id = msg.edits[ck][lk];
          if (applyEdit(dim, cx * CHUNK + Number(lm[1]), Number(lm[2]), cz * CHUNK + Number(lm[3]), id)) applied++;
          if (applied >= WORLD_LIMIT) break;
        }
      }
      if (applied > 0) broadcastToDimension(dim, { type: 'init', edits: dimEdits, dimension: dim }, ws);
    }
  });

  ws.on('close', () => {
    if (!me) return;
    players.delete(ws);
    broadcast({ type: 'left', id: me.id });
    me = null;
  });
});

// khởi tạo DB khi module load
loadWorldFromDb().catch(console.error);
