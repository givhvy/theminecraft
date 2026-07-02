// Smoke test WebSocket multiplayer trên deployment
import WebSocket from 'ws';

const URL = process.argv[2] || 'wss://theminecraft-kappa.vercel.app/ws';
const results = { p1: null, p2: null, p2SawP1: null, blockEcho: null };

const ws1 = new WebSocket(URL);
ws1.on('open', () => ws1.send(JSON.stringify({ type: 'join', name: 'SmokeOne' })));
ws1.on('message', (raw) => {
  const m = JSON.parse(raw);
  if (m.type === 'welcome') {
    results.p1 = { slot: m.slot, name: m.name };
    // người 2 vào sau khi người 1 đã join
    const ws2 = new WebSocket(URL);
    ws2.on('open', () => ws2.send(JSON.stringify({ type: 'join', name: 'SmokeTwo' })));
    ws2.on('message', (raw2) => {
      const m2 = JSON.parse(raw2);
      if (m2.type === 'welcome') {
        results.p2 = { slot: m2.slot, name: m2.name };
        results.p2SawP1 = m2.players.some(p => p.name === 'SmokeOne');
        // người 1 đặt block → người 2 phải nhận broadcast
        ws1.send(JSON.stringify({ type: 'setBlock', x: 500, y: 30, z: 500, id: 3 }));
      } else if (m2.type === 'setBlock' && m2.x === 500 && results.blockEcho === null) {
        results.blockEcho = m2.id === 3;
        // dọn: xoá block test
        ws1.send(JSON.stringify({ type: 'setBlock', x: 500, y: 30, z: 500, id: 0 }));
        setTimeout(() => { ws1.close(); ws2.close(); done(); }, 300);
      }
    });
    ws2.on('error', (e) => { console.error('ws2 error:', e.message); done(1); });
  }
});
ws1.on('error', (e) => { console.error('ws1 error:', e.message); done(1); });

function done(code = 0) {
  console.log(JSON.stringify(results));
  process.exit(code);
}
setTimeout(() => { console.error('timeout'); done(1); }, 20000);
