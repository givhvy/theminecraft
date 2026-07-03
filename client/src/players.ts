// Người chơi từ xa: avatar voxel màu theo profile slot, name tag, nội suy vị trí mượt
import * as THREE from 'three';
import { scene } from './scene';

export interface RemoteInfo { id: string; slot: number; name: string; registered: boolean }
interface Snap { t: number; x: number; y: number; z: number; yaw: number; pitch: number; ride: string | null }

// màu theo profile slot 1-10
export const SLOT_COLORS = [
  0xd94040, 0x3f76d9, 0x3fae4c, 0xe0c23a, 0x9450d0,
  0xe08030, 0x39bdbd, 0xe066a8, 0x8fd435, 0xf0f0f0,
];

const INTERP_DELAY = 0.13; // giây — đệm nội suy cho chuyển động mượt

function makeNameTag(name: string, slot: number): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 56;
  const g = c.getContext('2d')!;
  g.font = 'bold 26px "Segoe UI", sans-serif';
  const label = `P${slot} · ${name}`;
  const w = Math.min(g.measureText(label).width + 22, 254);
  g.fillStyle = 'rgba(0,0,0,0.55)';
  g.fillRect((256 - w) / 2, 6, w, 40);
  g.fillStyle = '#fff';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(label, 128, 27);
  const tex = new THREE.CanvasTexture(c);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  sprite.scale.set(2.4, 0.52, 1);
  sprite.position.y = 2.35;
  return sprite;
}

function part(w: number, h: number, d: number, color: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  m.castShadow = true;
  return m;
}

export class RemotePlayer {
  info: RemoteInfo;
  group = new THREE.Group();
  head: THREE.Mesh;
  legs: THREE.Mesh[] = [];
  snaps: Snap[] = [];
  walkPhase = 0;
  lastX = 0; lastZ = 0;
  /** trạng thái mới nhất cho tab cộng đồng (kể cả khác dimension) */
  latest: { x: number; y: number; z: number; ride: string | null; dimension: string; t: number } | null = null;
  prevLatest: { x: number; z: number; t: number } | null = null;

  setLatest(it: { x: number; y: number; z: number; ride: string | null; dimension?: string }): void {
    if (this.latest) this.prevLatest = { x: this.latest.x, z: this.latest.z, t: this.latest.t };
    this.latest = { x: it.x, y: it.y, z: it.z, ride: it.ride, dimension: it.dimension || 'overworld', t: performance.now() / 1000 };
  }

  constructor(info: RemoteInfo) {
    this.info = info;
    const color = SLOT_COLORS[(info.slot - 1) % SLOT_COLORS.length];
    const skin = 0xd8a878;
    this.head = part(0.5, 0.5, 0.5, skin); this.head.position.y = 1.62;
    // mặt đơn giản
    const eyeL = part(0.08, 0.08, 0.02, 0x222222); eyeL.position.set(-0.11, 0.04, -0.26);
    const eyeR = part(0.08, 0.08, 0.02, 0x222222); eyeR.position.set(0.11, 0.04, -0.26);
    this.head.add(eyeL, eyeR);
    const body = part(0.5, 0.7, 0.26, color); body.position.y = 1.02;
    const armL = part(0.16, 0.6, 0.16, color); armL.position.set(-0.35, 1.3, 0); armL.geometry.translate(0, -0.25, 0);
    const armR = part(0.16, 0.6, 0.16, color); armR.position.set(0.35, 1.3, 0); armR.geometry.translate(0, -0.25, 0);
    const legL = part(0.2, 0.66, 0.2, 0x37374a); legL.position.set(-0.13, 0.66, 0); legL.geometry.translate(0, -0.33, 0);
    const legR = part(0.2, 0.66, 0.2, 0x37374a); legR.position.set(0.13, 0.66, 0); legR.geometry.translate(0, -0.33, 0);
    this.legs = [legL, legR];
    this.group.add(this.head, body, armL, armR, legL, legR, makeNameTag(info.name, info.slot));
    this.group.visible = false; // ẩn tới khi có vị trí đầu tiên
    scene.add(this.group);
  }

  push(s: Omit<Snap, 't'>): void {
    this.snaps.push({ ...s, t: performance.now() / 1000 });
    if (this.snaps.length > 30) this.snaps.splice(0, this.snaps.length - 30);
  }

  update(dt: number): void {
    if (this.snaps.length === 0) return;
    const now = performance.now() / 1000 - INTERP_DELAY;
    // tìm cặp snapshot bао quanh thời điểm render
    let a = this.snaps[0], b = this.snaps[this.snaps.length - 1];
    for (let i = 0; i < this.snaps.length - 1; i++) {
      if (this.snaps[i].t <= now && this.snaps[i + 1].t >= now) { a = this.snaps[i]; b = this.snaps[i + 1]; break; }
    }
    const span = Math.max(b.t - a.t, 1e-6);
    const f = Math.min(Math.max((now - a.t) / span, 0), 1);
    const x = a.x + (b.x - a.x) * f;
    const y = a.y + (b.y - a.y) * f;
    const z = a.z + (b.z - a.z) * f;
    // yaw nội suy theo cung ngắn nhất
    let dyaw = b.yaw - a.yaw;
    while (dyaw > Math.PI) dyaw -= Math.PI * 2;
    while (dyaw < -Math.PI) dyaw += Math.PI * 2;
    this.group.visible = true;
    this.group.position.set(x, y, z);
    this.group.rotation.y = a.yaw + dyaw * f + Math.PI; // model quay mặt về hướng nhìn
    this.head.rotation.x = -(a.pitch + (b.pitch - a.pitch) * f);

    const speed = Math.hypot(x - this.lastX, z - this.lastZ) / Math.max(dt, 1e-6);
    this.lastX = x; this.lastZ = z;
    this.walkPhase += dt * Math.min(speed * 2.4, 12);
    const sw = Math.sin(this.walkPhase) * Math.min(speed * 0.35, 0.65);
    this.legs.forEach((leg, i) => { leg.rotation.x = i % 2 === 0 ? sw : -sw; });
  }

  remove(): void {
    scene.remove(this.group);
  }
}

export const remotePlayers = new Map<string, RemotePlayer>();

export function updateRemotePlayers(dt: number): void {
  for (const p of remotePlayers.values()) p.update(dt);
}
