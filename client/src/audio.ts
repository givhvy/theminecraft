// Hệ thống âm thanh procedural bằng WebAudio
import { B, type BlockMat } from '@shared/blocks';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

/** bus master: compressor làm mềm đỉnh + delay ngắn tạo cảm giác không gian */
function masterBus(c: AudioContext): GainNode {
  if (master) return master;
  master = c.createGain();
  master.gain.value = 0.9;
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -18; comp.knee.value = 22; comp.ratio.value = 5;
  comp.attack.value = 0.004; comp.release.value = 0.16;
  // "không khí": echo rất nhẹ, lọc tối để không nghe vang máy móc
  const delay = c.createDelay(0.3);
  delay.delayTime.value = 0.09;
  const fb = c.createGain(); fb.gain.value = 0.18;
  const wet = c.createGain(); wet.gain.value = 0.14;
  const damp = c.createBiquadFilter(); damp.type = 'lowpass'; damp.frequency.value = 1600;
  delay.connect(damp).connect(fb).connect(delay);
  master.connect(delay); delay.connect(wet);
  master.connect(comp); wet.connect(comp);
  comp.connect(c.destination);
  return master;
}

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
    // attack 5ms tránh click đầu âm
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g).connect(masterBus(c));
    o.start(); o.stop(c.currentTime + dur);
  } catch { /* audio bị chặn trước tương tác đầu tiên */ }
}
export function sfxNoise(dur: number, filterFreq = 1000, vol = 0.2, type: BiquadFilterType = 'lowpass'): void {
  try {
    const c = audio();
    const n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    // decay mũ nghe tự nhiên hơn tuyến tính
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-3.2 * (i / n));
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = filterFreq; f.Q.value = 0.8;
    const g = c.createGain(); g.gain.value = vol;
    src.connect(f).connect(g).connect(masterBus(c));
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
  sfxNoise(0.13, vary(m.f), m.vol);
  sfxNoise(0.09, vary(m.f * 0.35), m.vol * 0.6); // tiếng trầm vỡ vụn
  if (def?.mat === 'glass') { sfxNoise(0.18, 4500, 0.12, 'highpass'); sfxTone(2400, 0.1, 'triangle', 0.06, -600); }
  if (def?.mat === 'wood') sfxTone(vary(160), 0.07, 'square', 0.07);
  if (def?.mat === 'metal') sfxTone(vary(900), 0.12, 'triangle', 0.08, -200);
  if (def?.mat === 'cloth') sfxNoise(0.16, 500, 0.1);
  if (def?.mat === 'stone') sfxNoise(0.16, vary(300), 0.1); // đá rơi lộp cộp
}
export function sndPlace(blockId: number): void {
  const m = matOf(blockId);
  sfxNoise(0.06, vary(m.f * 0.8), m.vol * 0.7);
  sfxNoise(0.08, vary(240), 0.08); // thịch trầm khi đặt xuống
}
export function sndStep(blockId: number): void {
  // hai lớp gót-mũi lệch nhau như bước chân thật
  const m = matOf(blockId);
  sfxNoise(0.045, vary(m.f * 0.7), 0.04);
  setTimeout(() => sfxNoise(0.035, vary(m.f * 0.5), 0.028), 40 + Math.random() * 25);
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
export function sndSizzle(): void { sfxNoise(0.3, 2600, 0.16, 'highpass'); sfxTone(90, 0.22, 'sawtooth', 0.07, -30); }
export function sndZombieGroan(vol = 0.1): void {
  sfxTone(vary(85), 0.5, 'sawtooth', vol, 18);
  sfxTone(vary(64), 0.55, 'sawtooth', vol * 0.6, -10);
}

// ---- động vật ----
export function sndOink(vol = 0.1): void {
  sfxTone(vary(240), 0.12, 'sawtooth', vol, 90);
  setTimeout(() => sfxTone(vary(200), 0.1, 'sawtooth', vol * 0.7, -60), 120);
}
export function sndMoo(vol = 0.1): void {
  sfxTone(vary(160), 0.5, 'sawtooth', vol, -40);
  sfxTone(vary(85), 0.55, 'sawtooth', vol * 0.6, -15);
}
export function sndCluck(vol = 0.08): void {
  for (let i = 0; i < 3; i++) {
    setTimeout(() => sfxTone(vary(950), 0.05, 'square', vol * (1 - i * 0.2), 250), i * 90);
  }
}
export function sndBaa(vol = 0.1): void {
  // rung nhẹ như tiếng be be
  for (let i = 0; i < 4; i++) {
    setTimeout(() => sfxTone(vary(520), 0.09, 'sawtooth', vol * 0.8, i % 2 ? 40 : -40), i * 70);
  }
}
export function sndEggPop(): void {
  sfxNoise(0.06, 1800, 0.1);
  sfxTone(700, 0.08, 'triangle', 0.08, 300);
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
