// Server full stack cho TheMinecraft: phục vụ client + API lưu/đọc thế giới
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const WORLDS_DIR = path.join(__dirname, 'worlds');

fs.mkdirSync(WORLDS_DIR, { recursive: true });

app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function worldFile(name) {
  // chỉ cho phép tên an toàn để tránh path traversal
  if (!/^[a-z0-9_-]{1,32}$/i.test(name)) return null;
  return path.join(WORLDS_DIR, name + '.json');
}

// Đọc thế giới đã lưu (các block người chơi đã chỉnh sửa)
app.get('/api/world/:name', (req, res) => {
  const file = worldFile(req.params.name);
  if (!file) return res.status(400).json({ error: 'Tên thế giới không hợp lệ' });
  if (!fs.existsSync(file)) return res.json({ edits: {} });
  try {
    res.json(JSON.parse(fs.readFileSync(file, 'utf8')));
  } catch {
    res.json({ edits: {} });
  }
});

// Lưu thế giới
app.post('/api/world/:name', (req, res) => {
  const file = worldFile(req.params.name);
  if (!file) return res.status(400).json({ error: 'Tên thế giới không hợp lệ' });
  const edits = req.body && req.body.edits;
  if (typeof edits !== 'object' || edits === null) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
  }
  fs.writeFileSync(file, JSON.stringify({ edits, savedAt: Date.now() }));
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`TheMinecraft server đang chạy tại http://localhost:${PORT}`);
});
