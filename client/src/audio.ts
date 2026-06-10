// Hệ thống âm thanh procedural bằng WebAudio
import { B, type BlockMat } from '@shared/blocks';

let ctx: AudioContext | null = null;
export function audio(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function sfxTone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.12, slide = 0): void {
  try {
    const c = audio();
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, c.currentTime);
    if (slide) o.frequency.linearRampToValueAtTime(Math.max(freq + slide, 20), c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start(); o.stop(c.currentTime + dur);
  } catch { /* audio bị chặn trước tương tác đầu tiên */ }
}
export function sfxNoise(dur: number, filterFreq = 1000, vol = 0.2, type: BiquadFilterType = 'lowpass'): void {
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
  } catch { /* noop */ }
}
const vary = (f: number) => f * (0.86 + Math.random() * 0.28); // mỗi lần nghe hơi khác nhau cho tự nhiên

// ---- âm thanh theo chất liệu ----
const MAT_SFX: Record<BlockMat, { f: number; vol: number }> = {
  stone: { f: 800,  vol: 0.18 },
  wood:  { f: 500,  vol: 0.16 },
  earth: { f: 420,  vol: 0.14 },
  leaf:  { f: 2200, vol: 0.10 },
  glass: { f: 3200, vol: 0.16 },
  cloth: { f: 260,  vol: 0.12 },
  metal: { f: 1500, vol: 0.16 },
  other: { f: 1000, vol: 0.15 },
};
function matOf(blockId: number) { return (B[blockId] && MAT_SFX[B[blockId].mat]) || MAT_SFX.other; }

export function sndBreak(blockId: number): void {
  const def = B[blockId], m = matOf(blockId);
  sfxNoise(0.12, vary(m.f), m.vol);
  if (def?.mat === 'glass') { sfxNoise(0.18, 4500, 0.12, 'highpass'); sfxTone(2400, 0.1, 'triangle', 0.06, -600); }
  if (def?.mat === 'wood') sfxTone(vary(160), 0.07, 'square', 0.07);
  if (def?.mat === 'metal') sfxTone(vary(900), 0.12, 'triangle', 0.08, -200);
  if (def?.mat === 'cloth') sfxNoise(0.16, 500, 0.1);
}
export function sndPlace(blockId: number): void {
  const m = matOf(blockId);
  sfxNoise(0.06, vary(m.f * 0.8), m.vol * 0.7);
  sfxTone(vary(m.f * 0.3), 0.06, 'square', 0.06);
}
export function sndStep(blockId: number): void {
  const m = matOf(blockId);
  sfxNoise(0.05, vary(m.f * 0.7), 0.045);
}
export function sndJump(): void { sfxNoise(0.07, 900, 0.04); }
export function sndLand(force = 1): void { sfxNoise(0.1, 500, Math.min(0.08 * force, 0.25)); }
export function sndSplash(): void { sfxNoise(0.25, 1300, 0.2); sfxTone(300, 0.15, 'sine', 0.08, 150); }

// ---- chiến đấu ----
export function sndHit(): void { sfxTone(vary(140), 0.1, 'sawtooth', 0.13); sfxNoise(0.05, 700, 0.1); }
export function sndHurt(): void { sfxTone(160, 0.25, 'sawtooth', 0.16, -80); }
export function sndMobDeath(): void { sfxTone(220, 0.4, 'sawtooth', 0.14, -160); }
export function sndExplode(): void { sfxNoise(0.7, 350, 0.4); sfxTone(60, 0.5, 'sine', 0.3, -30); }
export function sndFuse(): void { sfxNoise(0.35, 4200, 0.09, 'highpass'); }
export function sndZombieGroan(vol = 0.1): void {
  sfxTone(vary(85), 0.5, 'sawtooth', vol, 18);
  sfxTone(vary(64), 0.55, 'sawtooth', vol * 0.6, -10);
}

// ---- ngựa & thuyền ----
export function sndHorseNeigh(vol = 0.1): void {
  sfxTone(vary(900), 0.12, 'sawtooth', vol, 300);
  setTimeout(() => sfxTone(vary(750), 0.3, 'sawtooth', vol * 0.8, -350), 110);
}
export function sndGallop(): void {
  sfxNoise(0.04, 1100, 0.07, 'bandpass');
  setTimeout(() => sfxNoise(0.04, 900, 0.05, 'bandpass'), 70);
}
export function sndPaddle(): void { sfxNoise(0.16, 1100, 0.09); sfxTone(240, 0.08, 'sine', 0.04, 80); }
export function sndMount(): void { sfxNoise(0.08, 700, 0.08); sfxTone(330, 0.06, 'triangle', 0.06); }
export function sndDismount(): void { sfxNoise(0.08, 500, 0.07); }

// ---- UI ----
export function sndClick(): void { sfxTone(800, 0.04, 'square', 0.05); }
export function sndSlot(): void { sfxTone(620, 0.03, 'square', 0.045); }
export function sndOpen(): void { sfxTone(440, 0.07, 'triangle', 0.07, 220); }
export function sndClose(): void { sfxTone(660, 0.07, 'triangle', 0.07, -220); }
export function sndBuildTick(): void { sfxTone(520 + Math.random() * 200, 0.04, 'square', 0.04); }
export function sndBuildDone(): void {
  sfxTone(523, 0.12, 'triangle', 0.1);
  setTimeout(() => sfxTone(659, 0.12, 'triangle', 0.1), 110);
  setTimeout(() => sfxTone(784, 0.2, 'triangle', 0.1), 220);
}

// ---- môi trường ----
export function sndBird(): void {
  const f = 2600 + Math.random() * 900;
  sfxTone(f, 0.07, 'sine', 0.035, 500);
  setTimeout(() => sfxTone(f + 400, 0.09, 'sine', 0.03, -300), 90);
}
export function sndCricket(): void {
  for (let i = 0; i < 3; i++) setTimeout(() => sfxTone(4200, 0.03, 'sine', 0.025), i * 70);
}
