// Server authoritative cho world state: Express + WebSocket
// - Giữ toàn bộ block edits, validate từng edit của client
// - Broadcast realtime cho mọi client đang kết nối
// - Lưu xuống worlds/<name>.json (debounce)
import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HEIGHT } from '../shared/config.js';
import { isValidBlockId } from '../shared/blocks.js';
import { CHUNK } from '../shared/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const WORLDS_DIR = path.join(__dirname, '..', 'worlds');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const WORLD_LIMIT = 200000; // giới hạn block edits để chống spam phá hoại

fs.mkdirSync(WORLDS_DIR, { recursive: true });

type EditMap = Record<string, Record<string, number>>;

function worldFile(name: string): string | null {
  if (!/^[a-z0-9_-]{1,32}$/i.test(name)) return null;
  return path.join(WORLDS_DIR, name + '.json');
}

// ---- world state trong bộ nhớ (nguồn sự thật duy nhất) ----
const WORLD_NAME = 'default';
let edits: EditMap = {};
let editCount = 0;
{
  const file = worldFile(WORLD_NAME)!;
  if (fs.existsSync(file)) {
    try {
      edits = (JSON.parse(fs.readFileSync(file, 'utf8')).edits as EditMap) || {};
      editCount = Object.values(edits).reduce((n, c) => n + Object.keys(c).length, 0);
    } catch { edits = {}; }
  }
}

let saveTimer: NodeJS.Timeout | null = null;
function scheduleSave(): void {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const file = worldFile(WORLD_NAME)!;
    fs.writeFileSync(file, JSON.stringify({ edits, savedAt: Date.now() }));
  }, 3000);
}

function applyEdit(x: number, y: number, z: number, id: number): boolean {
  // validate: id hợp lệ, trong giới hạn thế giới, không đụng bedrock
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

// ---- HTTP ----
const app = express();
app.use(express.json({ limit: '1mb' }));

// API đọc thế giới (dùng cho lần tải đầu / client fallback)
app.get('/api/world/:name', (req, res) => {
  if (req.params.name !== WORLD_NAME) return res.status(404).json({ error: 'Không tìm thấy thế giới' });
  res.json({ edits });
});

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
}

const server = createServer(app);

// ---- WebSocket: đồng bộ block edits realtime ----
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'init', edits }));
  ws.on('message', (raw) => {
    let msg: { type?: string; x?: number; y?: number; z?: number; id?: number };
    try { msg = JSON.parse(String(raw)); } catch { return; }
    if (msg.type !== 'setBlock') return;
    const { x, y, z, id } = msg as { x: number; y: number; z: number; id: number };
    if (!applyEdit(x, y, z, id)) return; // server từ chối edit không hợp lệ
    const out = JSON.stringify({ type: 'setBlock', x, y, z, id });
    for (const client of wss.clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) client.send(out);
    }
  });
});

server.listen(PORT, () => {
  console.log(`TheMinecraft server (authoritative world) chạy tại http://localhost:${PORT}`);
});
