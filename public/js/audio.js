// Hệ thống âm thanh procedural bằng WebAudio — không cần file âm thanh
import { B } from './blocks.js';

let ctx = null;
export function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function sfxTone(freq, dur, type = 'square', vol = 0.12, slide = 0) {
  try {
    const c = audio();
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, c.currentTime);
    if (slide) o.frequency.linearRampToValueAtTime(Math.max(freq + slide, 20), c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start(); o.stop(c.currentTime + dur);
  } catch {}
}
export function sfxNoise(dur, filterFreq = 1000, vol = 0.2, type = 'lowpass') {
  try {
    const c = audio();
    const n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = filterFreq;
    const g = c.createGain(); g.gain.value = vol;
    src.connect(f).connect(g).connect(c.destination);
    src.start();
  } catch {}
}

// ---- âm thanh theo chất liệu block ----
const MAT_SFX = {
  stone: { f: 800,  vol: 0.18 },
  wood:  { f: 500,  vol: 0.16 },
  earth: { f: 420,  vol: 0.14 },
  leaf:  { f: 2200, vol: 0.10 },
  glass: { f: 3200, vol: 0.16 },
  other: { f: 1000, vol: 0.15 },
};
function matOf(blockId) { return (B[blockId] && MAT_SFX[B[blockId].mat]) || MAT_SFX.other; }

export function sndBreak(blockId) {
  const m = matOf(blockId);
  sfxNoise(0.12, m.f, m.vol);
  if (B[blockId] && B[blockId].mat === 'glass') { sfxNoise(0.18, 4500, 0.12, 'highpass'); sfxTone(2400, 0.1, 'triangle', 0.06, -600); }
  if (B[blockId] && B[blockId].mat === 'wood') sfxTone(160, 0.07, 'square', 0.07);
}
export function sndPlace(blockId) {
  const m = matOf(blockId);
  sfxNoise(0.06, m.f * 0.8, m.vol * 0.7);
  sfxTone(m.f * 0.3, 0.06, 'square', 0.06);
}
export function sndStep(blockId) {
  const m = matOf(blockId);
  sfxNoise(0.05, m.f * 0.7, 0.045);
}
export function sndJump() { sfxNoise(0.07, 900, 0.04); }
export function sndLand(force = 1) { sfxNoise(0.1, 500, Math.min(0.08 * force, 0.25)); }
export function sndSplash() { sfxNoise(0.25, 1300, 0.2); sfxTone(300, 0.15, 'sine', 0.08, 150); }
export function sndSwim() { sfxNoise(0.12, 1000, 0.06); }

// ---- chiến đấu ----
export function sndHit() { sfxTone(140, 0.1, 'sawtooth', 0.13); sfxNoise(0.05, 700, 0.1); }
export function sndHurt() { sfxTone(160, 0.25, 'sawtooth', 0.16, -80); }
export function sndMobDeath() { sfxTone(220, 0.4, 'sawtooth', 0.14, -160); }
export function sndExplode() { sfxNoise(0.7, 350, 0.4); sfxTone(60, 0.5, 'sine', 0.3, -30); }
export function sndFuse() { sfxNoise(0.35, 4200, 0.09, 'highpass'); }
export function sndZombieGroan(vol = 0.1) {
  sfxTone(85, 0.5, 'sawtooth', vol, 18);
  sfxTone(64, 0.55, 'sawtooth', vol * 0.6, -10);
}

// ---- UI ----
export function sndClick() { sfxTone(800, 0.04, 'square', 0.05); }
export function sndSlot() { sfxTone(620, 0.03, 'square', 0.045); }
export function sndOpen() { sfxTone(440, 0.07, 'triangle', 0.07, 220); }
export function sndClose() { sfxTone(660, 0.07, 'triangle', 0.07, -220); }
export function sndBuildTick() { sfxTone(520 + Math.random() * 200, 0.04, 'square', 0.04); }
export function sndBuildDone() { sfxTone(523, 0.12, 'triangle', 0.1); setTimeout(() => sfxTone(659, 0.12, 'triangle', 0.1), 110); setTimeout(() => sfxTone(784, 0.2, 'triangle', 0.1), 220); }

// ---- môi trường ----
export function sndBird() {
  const f = 2600 + Math.random() * 900;
  sfxTone(f, 0.07, 'sine', 0.035, 500);
  setTimeout(() => sfxTone(f + 400, 0.09, 'sine', 0.03, -300), 90);
}
export function sndCricket() {
  for (let i = 0; i < 3; i++) setTimeout(() => sfxTone(4200, 0.03, 'sine', 0.025), i * 70);
}
