// Server authoritative: world state + multiplayer 10 người + tài khoản tuỳ chọn
// Dùng chung cho chạy local (server/index.ts) và Vercel Functions (api/index.ts)
import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HEIGHT, CHUNK } from '../shared/config.js';
import { isValidBlockId } from '../shared/blocks.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ON_VERCEL = !!process.env.VERCEL;
// Vercel: filesystem chỉ ghi được /tmp (mất khi cold start) — client sẽ seed lại world từ localStorage
const DATA_DIR = ON_VERCEL ? '/tmp/theminecraft' : path.join(__dirname, '..', 'worlds');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const WORLD_LIMIT = 200000;
const MAX_PLAYERS = 10;
const AUTH_SECRET = process.env.AUTH_SECRET || 'theminecraft-game-secret-v1';

try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch { /* read-only fs */ }

type EditMap = Record<string, Record<string, number>>;

// ================= world state =================
const WORLD_NAME = 'default';
const worldFile = path.join(DATA_DIR, WORLD_NAME + '.json');
let edits: EditMap = {};
let editCount = 0;
try {
  if (fs.existsSync(worldFile)) {
    edits = (JSON.parse(fs.readFileSync(worldFile, 'utf8')).edits as EditMap) || {};
    editCount = Object.values(edits).reduce((n, c) => n + Object.keys(c).length, 0);
  }
} catch { edits = {}; }

let saveTimer: NodeJS.Timeout | null = null;
function scheduleSave(): void {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try { fs.writeFileSync(worldFile, JSON.stringify({ edits, savedAt: Date.now() })); } catch { /* noop */ }
  }, 3000);
}

function applyEdit(x: number, y: number, z: number, id: number): boolean {
  if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(z) || !Number.isInteger(id)) return false;
  if (y < 1 || y >= HEIGHT) return false;
  if (Math.abs(x) > 100000 || Math.abs(z) > 100000) return false;
  if (!isValidBlockId(id)) return false;
  if (editCount >= WORLD_LIMIT) return false;
  const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
  const ck = cx + ',' + cz;
  const lk = `${x - cx * CHUNK},${y},${z - cz * CHUNK}`;
  const chunk = (edits[ck] = edits[ck] || {});
  if (!(lk in chunk)) editCount++;
  chunk[lk] = id;
  scheduleSave();
  return true;
}

// ================= tài khoản (tuỳ chọn) =================
// Token HMAC không trạng thái: đăng nhập sống sót qua restart server (quan trọng trên Vercel)
const accountsFile = path.join(DATA_DIR, 'accounts.json');
let accounts: Record<string, { salt: string; hash: string }> = {};
try {
  if (fs.existsSync(accountsFile)) accounts = JSON.parse(fs.readFileSync(accountsFile, 'utf8'));
} catch { accounts = {}; }
function saveAccounts(): void {
  try { fs.writeFileSync(accountsFile, JSON.stringify(accounts)); } catch { /* noop */ }
}
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
  slot: number;          // profile 1-10
  name: string;
  registered: boolean;
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
function pub(p: Player) { return { id: p.id, slot: p.slot, name: p.name, registered: p.registered }; }
function broadcast(msg: unknown, except?: WebSocket): void {
  const out = JSON.stringify(msg);
  for (const [ws] of players) {
    if (ws !== except && ws.readyState === WebSocket.OPEN) ws.send(out);
  }
}

// tick vị trí 15Hz — gom mọi vị trí vào một gói cho mượt và tiết kiệm
setInterval(() => {
  if (players.size < 2) return;
  const list = [...players.values()].filter(p => p.hasPos)
    .map(p => ({ id: p.id, x: p.x, y: p.y, z: p.z, yaw: p.yaw, pitch: p.pitch, ride: p.ride }));
  if (list.length === 0) return;
  broadcast({ type: 'players', list });
}, 66);

// ================= HTTP =================
export const app = express();
app.use(express.json({ limit: '4mb' }));

app.get('/api/world/:name', (req, res) => {
  if (req.params.name !== WORLD_NAME) return res.status(404).json({ error: 'world not found' });
  res.json({ edits });
});
app.get('/api/status', (_req, res) => {
  res.json({ players: players.size, max: MAX_PLAYERS, editCount });
});

app.post('/api/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!validName(username)) return res.status(400).json({ error: 'bad_username' });
  if (typeof password !== 'string' || password.length < 4) return res.status(400).json({ error: 'bad_password' });
  const key = username.toLowerCase();
  if (accounts[key]) return res.status(409).json({ error: 'taken' });
  const salt = crypto.randomBytes(16).toString('hex');
  accounts[key] = { salt, hash: hashPassword(password, salt) };
  saveAccounts();
  res.json({ token: signToken(username), username });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!validName(username) || typeof password !== 'string') return res.status(400).json({ error: 'bad_request' });
  const acc = accounts[username.toLowerCase()];
  if (!acc || hashPassword(password, acc.salt) !== acc.hash) return res.status(401).json({ error: 'invalid' });
  res.json({ token: signToken(username), username });
});

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
}

export const server = createServer(app);

// ================= WebSocket =================
// Không lọc theo path: Vercel rewrite có thể đổi URL của upgrade request
const wss = new WebSocketServer({ server });

type ClientMsg =
  | { type: 'join'; name?: string; token?: string }
  | { type: 'setBlock'; x: number; y: number; z: number; id: number }
  | { type: 'pos'; x: number; y: number; z: number; yaw: number; pitch: number; ride?: string | null }
  | { type: 'seed'; edits: EditMap };

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
        x: 0, y: 0, z: 0, yaw: 0, pitch: 0, ride: null, hasPos: false,
      };
      players.set(ws, me);
      ws.send(JSON.stringify({
        type: 'welcome', id: me.id, slot, name, registered, edits,
        players: [...players.values()].filter(p => p !== me).map(pub),
      }));
      broadcast({ type: 'joined', p: pub(me) }, ws);
      return;
    }

    if (!me) return; // mọi message khác yêu cầu đã join

    if (msg.type === 'setBlock') {
      const { x, y, z, id } = msg;
      if (!applyEdit(x, y, z, id)) return;
      broadcast({ type: 'setBlock', x, y, z, id }, ws);
    } else if (msg.type === 'pos') {
      if (![msg.x, msg.y, msg.z, msg.yaw, msg.pitch].every(Number.isFinite)) return;
      me.x = msg.x; me.y = msg.y; me.z = msg.z; me.yaw = msg.yaw; me.pitch = msg.pitch;
      me.ride = msg.ride === 'horse' || msg.ride === 'boat' ? msg.ride : null;
      me.hasPos = true;
    } else if (msg.type === 'seed') {
      // khôi phục world khi server trống (Vercel cold start) từ bản localStorage của client
      if (editCount > 0 || typeof msg.edits !== 'object' || !msg.edits) return;
      let applied = 0;
      for (const ck in msg.edits) {
        const m = /^(-?\d+),(-?\d+)$/.exec(ck);
        if (!m) continue;
        const cx = Number(m[1]), cz = Number(m[2]);
        for (const lk in msg.edits[ck]) {
          const lm = /^(\d+),(\d+),(\d+)$/.exec(lk);
          if (!lm) continue;
          const id = msg.edits[ck][lk];
          if (applyEdit(cx * CHUNK + Number(lm[1]), Number(lm[2]), cz * CHUNK + Number(lm[3]), id)) applied++;
          if (applied >= WORLD_LIMIT) break;
        }
      }
      if (applied > 0) broadcast({ type: 'init', edits }, ws);
    }
  });

  ws.on('close', () => {
    if (!me) return;
    players.delete(ws);
    broadcast({ type: 'left', id: me.id });
    me = null;
  });
});
