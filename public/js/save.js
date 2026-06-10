// Lưu / tải thế giới: ưu tiên server, fallback localStorage
import { WORLD_NAME } from './config.js';
import { world } from './world.js';
import { showSaved } from './ui.js';

let useServer = false;
export function isUsingServer() { return useServer; }

export async function loadWorld() {
  try {
    const r = await fetch(`/api/world/${WORLD_NAME}`);
    if (r.ok) {
      const data = await r.json();
      world.editsByChunk = data.edits || {};
      useServer = true;
      return;
    }
  } catch {}
  try {
    world.editsByChunk = JSON.parse(localStorage.getItem('theminecraft_world') || '{}');
  } catch { world.editsByChunk = {}; }
}

export async function saveWorld() {
  if (!world.pendingSave) return;
  world.pendingSave = false;
  try {
    if (useServer) {
      await fetch(`/api/world/${WORLD_NAME}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edits: world.editsByChunk }),
        keepalive: true,
      });
    } else {
      localStorage.setItem('theminecraft_world', JSON.stringify(world.editsByChunk));
    }
    showSaved();
  } catch { world.pendingSave = true; }
}

setInterval(saveWorld, 10000);
window.addEventListener('beforeunload', () => { saveWorld(); });
