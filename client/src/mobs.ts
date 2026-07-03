// Zombie, Creeper & Ngựa: mô hình, AI, sát thương, âm thanh
import * as THREE from 'three';
import { CHUNK, GRAVITY, MAX_MOBS, MAX_HORSES, SEA_LEVEL, HORSE_SPEED } from '@shared/config';
import { terrainHeight } from '@shared/noise';
import { moveEntity } from '@shared/physics';
import { world, getCurrentDimension } from '@shared/world';
import { isNearThemePark } from '@shared/themepark';
import { scene, sunElevation } from './scene';
import { player, damagePlayer, type Rideable } from './player';
import { mobs } from './entities';
import { explode } from './tnt';
import { spawnParticle } from './particles';
import { sndHit, sndFuse, sndZombieGroan, sndMobDeath, sndHorseNeigh, sndOink, sndMoo, sndCluck, sndBaa } from './audio';

export type MobType = 'zombie' | 'creeper' | 'horse' | 'pig' | 'cow' | 'chicken' | 'sheep';
export const PASSIVE_TYPES: MobType[] = ['horse', 'pig', 'cow', 'chicken', 'sheep'];
export function isPassive(t: MobType): boolean { return PASSIVE_TYPES.includes(t); }

function makeFaceTexture(draw: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  draw(c.getContext('2d')!);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
  return tex;
}
const zombieFace = makeFaceTexture(g => {
  g.fillStyle = '#4e9b3c'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#2a5e20';
  for (let i = 0; i < 30; i++) g.fillRect((Math.random() * 16) | 0, (Math.random() * 16) | 0, 1, 1);
  g.fillStyle = '#111'; g.fillRect(3, 6, 3, 2); g.fillRect(10, 6, 3, 2);
  g.fillStyle = '#333'; g.fillRect(6, 11, 4, 2);
});
const creeperFace = makeFaceTexture(g => {
  g.fillStyle = '#54c354'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#3a9b3a';
  for (let i = 0; i < 30; i++) g.fillRect((Math.random() * 16) | 0, (Math.random() * 16) | 0, 1, 1);
  g.fillStyle = '#111';
  g.fillRect(3, 4, 4, 4); g.fillRect(9, 4, 4, 4);
  g.fillRect(6, 8, 4, 4); g.fillRect(4, 11, 2, 4); g.fillRect(10, 11, 2, 4);
});
const horseFace = makeFaceTexture(g => {
  g.fillStyle = '#8a5a32'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#6e4423';
  for (let i = 0; i < 24; i++) g.fillRect((Math.random() * 16) | 0, (Math.random() * 16) | 0, 1, 1);
  g.fillStyle = '#f0ead8'; g.fillRect(6, 8, 4, 8);   // vệt trắng mũi
  g.fillStyle = '#111'; g.fillRect(2, 3, 3, 3); g.fillRect(11, 3, 3, 3);
});
const pigFace = makeFaceTexture(g => {
  g.fillStyle = '#eda3a3'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#d98888'; g.fillRect(4, 8, 8, 5);   // mõm
  g.fillStyle = '#7a3a3a'; g.fillRect(6, 10, 1, 2); g.fillRect(9, 10, 1, 2); // lỗ mũi
  g.fillStyle = '#111'; g.fillRect(2, 4, 2, 2); g.fillRect(12, 4, 2, 2);
});
const cowFace = makeFaceTexture(g => {
  g.fillStyle = '#6b4a33'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#e8e0d2'; g.fillRect(4, 9, 8, 7);   // mõm sáng
  g.fillStyle = '#5a3a26'; g.fillRect(5, 11, 2, 2); g.fillRect(9, 11, 2, 2);
  g.fillStyle = '#111'; g.fillRect(2, 4, 2, 2); g.fillRect(12, 4, 2, 2);
});
const chickenFace = makeFaceTexture(g => {
  g.fillStyle = '#f2eee6'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#e8b23a'; g.fillRect(6, 9, 4, 4);   // mỏ vàng
  g.fillStyle = '#c94040'; g.fillRect(6, 13, 4, 3);  // yếm đỏ
  g.fillStyle = '#111'; g.fillRect(3, 4, 2, 2); g.fillRect(11, 4, 2, 2);
});
const sheepFace = makeFaceTexture(g => {
  g.fillStyle = '#d8cfc2'; g.fillRect(0, 0, 16, 16); // mặt xám nhạt
  g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, 16, 5);  // lông trán
  g.fillStyle = '#111'; g.fillRect(3, 6, 2, 2); g.fillRect(11, 6, 2, 2);
  g.fillStyle = '#b09a8a'; g.fillRect(6, 11, 4, 3);
});

function box(w: number, h: number, d: number, color: number, faceTex?: THREE.Texture): THREE.Mesh {
  let mat: THREE.Material | THREE.Material[];
  if (faceTex) {
    mat = [0, 1, 2, 3, 4, 5].map(i =>
      i === 4 ? new THREE.MeshLambertMaterial({ map: faceTex }) : new THREE.MeshLambertMaterial({ color }));
  } else {
    mat = new THREE.MeshLambertMaterial({ color });
  }
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = true;
  return m;
}

export class Mob implements Rideable {
  type: MobType;
  pos: THREE.Vector3;
  vel = new THREE.Vector3();
  onGround = false;
  hp = 20;
  halfW = 0.3;
  height = 1.8;
  speed = 2.7;
  detect = 18;
  wanderTimer = 0;
  groanTimer = 3 + Math.random() * 6;
  heading = Math.random() * Math.PI * 2;
  attackCd = 0;
  fuse = -1;
  walkPhase = 0;
  flashUntil = 0;
  idle = false;
  group = new THREE.Group();
  parts: Record<string, THREE.Mesh> = {};
  legs: THREE.Mesh[] = [];
  // Rideable (chỉ dùng cho ngựa)
  seatHeight = 1.5;
  rideSpeed = HORSE_SPEED;
  rideKind = 'horse' as const;
  ridden = false;

  constructor(type: MobType, x: number, y: number, z: number) {
    this.type = type;
    this.pos = new THREE.Vector3(x, y, z);
    this.group.userData.mob = this;

    if (type === 'zombie') {
      this.halfW = 0.3; this.height = 1.8; this.speed = 2.7; this.detect = 18;
      const skin = 0x4e9b3c, shirt = 0x2f6fb5, pants = 0x35357f;
      const head = box(0.5, 0.5, 0.5, skin, zombieFace); head.position.y = 1.62;
      const body = box(0.5, 0.7, 0.26, shirt); body.position.y = 1.02;
      const armL = box(0.18, 0.62, 0.18, skin); armL.position.set(-0.36, 1.32, 0); armL.geometry.translate(0, -0.26, 0);
      const armR = box(0.18, 0.62, 0.18, skin); armR.position.set(0.36, 1.32, 0); armR.geometry.translate(0, -0.26, 0);
      const legL = box(0.2, 0.66, 0.2, pants); legL.position.set(-0.13, 0.66, 0); legL.geometry.translate(0, -0.33, 0);
      const legR = box(0.2, 0.66, 0.2, pants); legR.position.set(0.13, 0.66, 0); legR.geometry.translate(0, -0.33, 0);
      armL.rotation.x = armR.rotation.x = -1.35;
      this.group.add(head, body, armL, armR, legL, legR);
      this.parts = { head, armL, armR };
      this.legs = [legL, legR];
    } else if (type === 'creeper') {
      this.halfW = 0.3; this.height = 1.6; this.speed = 3.1; this.detect = 14;
      const green = 0x54c354;
      const head = box(0.55, 0.55, 0.55, green, creeperFace); head.position.y = 1.32;
      const body = box(0.46, 0.76, 0.32, green); body.position.y = 0.66;
      for (const [lx, lz] of [[-0.14, 0.18], [0.14, 0.18], [-0.14, -0.18], [0.14, -0.18]]) {
        const leg = box(0.22, 0.3, 0.22, 0x3a9b3a);
        leg.position.set(lx, 0.15, lz);
        this.group.add(leg);
      }
      this.group.add(head, body);
      this.parts = { head, body };
    } else if (type === 'pig') {
      this.halfW = 0.4; this.height = 0.9; this.speed = 1.8; this.detect = 0; this.hp = 12;
      const pink = 0xeda3a3, pinkD = 0xd98888;
      const body = box(0.7, 0.55, 1.1, pink); body.position.y = 0.62;
      const head = box(0.5, 0.5, 0.45, pink, pigFace); head.position.set(0, 0.72, -0.72);
      const snout = box(0.24, 0.16, 0.1, pinkD); snout.position.set(0, 0.65, -0.98);
      const tail = box(0.08, 0.08, 0.18, pinkD); tail.position.set(0, 0.78, 0.6); tail.rotation.x = -0.6;
      for (const [lx, lz] of [[-0.22, 0.35], [0.22, 0.35], [-0.22, -0.35], [0.22, -0.35]]) {
        const leg = box(0.18, 0.36, 0.18, pinkD);
        leg.position.set(lx, 0.36, lz); leg.geometry.translate(0, -0.18, 0);
        this.legs.push(leg); this.group.add(leg);
      }
      this.group.add(body, head, snout, tail);
      this.parts = { head, body };
    } else if (type === 'cow') {
      this.halfW = 0.45; this.height = 1.3; this.speed = 1.6; this.detect = 0; this.hp = 16;
      const coat = 0x6b4a33, patch = 0xe8e0d2, horn = 0xd8d0c0;
      const body = box(0.8, 0.7, 1.3, coat); body.position.y = 0.95;
      // đốm trắng
      for (const [px, py, pz] of [[-0.25, 1.1, 0.3], [0.28, 0.9, -0.15], [0.1, 1.2, 0.5]]) {
        const p = box(0.3, 0.25, 0.35, patch); p.position.set(px, py, pz);
        this.group.add(p);
      }
      const head = box(0.45, 0.45, 0.4, coat, cowFace); head.position.set(0, 1.35, -0.85);
      const hornL = box(0.08, 0.14, 0.08, horn); hornL.position.set(-0.24, 1.62, -0.8);
      const hornR = hornL.clone(); hornR.position.x = 0.24;
      const udder = box(0.3, 0.16, 0.34, 0xf0c8c8); udder.position.set(0, 0.55, 0.35);
      for (const [lx, lz] of [[-0.26, 0.45], [0.26, 0.45], [-0.26, -0.45], [0.26, -0.45]]) {
        const leg = box(0.2, 0.6, 0.2, coat);
        leg.position.set(lx, 0.6, lz); leg.geometry.translate(0, -0.3, 0);
        this.legs.push(leg); this.group.add(leg);
      }
      this.group.add(body, head, hornL, hornR, udder);
      this.parts = { head, body };
    } else if (type === 'chicken') {
      this.halfW = 0.22; this.height = 0.7; this.speed = 2.2; this.detect = 0; this.hp = 6;
      const white = 0xf2eee6, wing = 0xe4ded2;
      const body = box(0.4, 0.4, 0.55, white); body.position.y = 0.45;
      const head = box(0.28, 0.32, 0.26, white, chickenFace); head.position.set(0, 0.78, -0.3);
      const comb = box(0.1, 0.1, 0.14, 0xc94040); comb.position.set(0, 0.98, -0.3);
      const wingL = box(0.08, 0.28, 0.4, wing); wingL.position.set(-0.24, 0.5, 0);
      const wingR = wingL.clone(); wingR.position.x = 0.24;
      const tailF = box(0.3, 0.22, 0.14, wing); tailF.position.set(0, 0.58, 0.32); tailF.rotation.x = 0.5;
      for (const lx of [-0.1, 0.1]) {
        const leg = box(0.06, 0.26, 0.06, 0xe8b23a);
        leg.position.set(lx, 0.25, 0.05); leg.geometry.translate(0, -0.13, 0);
        this.legs.push(leg); this.group.add(leg);
      }
      this.group.add(body, head, comb, wingL, wingR, tailF);
      this.parts = { head, body };
    } else if (type === 'sheep') {
      this.halfW = 0.4; this.height = 1.1; this.speed = 1.7; this.detect = 0; this.hp = 12;
      const wool = 0xf4f1ea, skin = 0xd8cfc2;
      const body = box(0.75, 0.65, 1.15, wool); body.position.y = 0.85;
      const head = box(0.34, 0.36, 0.34, skin, sheepFace); head.position.set(0, 1.15, -0.72);
      const woolHat = box(0.4, 0.14, 0.4, wool); woolHat.position.set(0, 1.38, -0.72);
      for (const [lx, lz] of [[-0.22, 0.4], [0.22, 0.4], [-0.22, -0.4], [0.22, -0.4]]) {
        const leg = box(0.16, 0.5, 0.16, skin);
        leg.position.set(lx, 0.5, lz); leg.geometry.translate(0, -0.25, 0);
        this.legs.push(leg); this.group.add(leg);
      }
      this.group.add(body, head, woolHat);
      this.parts = { head, body };
    } else { // horse — nâng cấp model chi tiết
      this.halfW = 0.45; this.height = 1.6; this.speed = 2.2; this.detect = 0;
      this.hp = 26;
      const coat = 0x8a5a32, mane = 0x4a2f18, hoof = 0x3a2818;
      const body = box(0.75, 0.75, 1.45, coat); body.position.y = 1.0;
      const neck = box(0.32, 0.75, 0.38, coat); neck.position.set(0, 1.58, -0.65); neck.rotation.x = 0.45;
      const head = box(0.38, 0.42, 0.65, coat, horseFace); head.position.set(0, 1.95, -0.95);
      const snout = box(0.28, 0.22, 0.28, 0xc4a882); snout.position.set(0, 1.82, -1.18);
      const maneM = box(0.14, 0.65, 0.32, mane); maneM.position.set(0, 1.75, -0.48);
      const tail = box(0.16, 0.65, 0.16, mane); tail.position.set(0, 1.05, 0.78); tail.rotation.x = 0.55;
      for (const [lx, lz] of [[-0.26, 0.52], [0.26, 0.52], [-0.26, -0.52], [0.26, -0.52]]) {
        const leg = box(0.2, 0.68, 0.2, coat);
        leg.position.set(lx, 0.68, lz);
        leg.geometry.translate(0, -0.34, 0);
        const hoofM = box(0.22, 0.1, 0.22, hoof);
        hoofM.position.set(lx, 0.05, lz);
        this.legs.push(leg);
        this.group.add(leg, hoofM);
      }
      const saddle = box(0.52, 0.14, 0.52, 0x9b3f2e); saddle.position.y = 1.44;
      const stirrupL = box(0.06, 0.2, 0.06, 0x666666); stirrupL.position.set(-0.3, 1.0, 0);
      const stirrupR = stirrupL.clone(); stirrupR.position.x = 0.3;
      this.group.add(body, neck, head, snout, maneM, tail, saddle, stirrupL, stirrupR);
      this.parts = { head, body };
    }
    scene.add(this.group);
  }

  update(dt: number): void {
    // ngựa đang được cưỡi: player.ts điều khiển vật lý, ở đây chỉ animate
    if (this.ridden) {
      this.group.position.copy(this.pos);
      this.group.rotation.y = this.heading;
      const moving = Math.hypot(this.vel.x, this.vel.z) > 0.5;
      this.walkPhase += dt * (moving ? 11 : 0);
      const sw = Math.sin(this.walkPhase) * 0.8;
      this.legs.forEach((leg, i) => { leg.rotation.x = i % 2 === 0 ? sw : -sw; });
      return;
    }

    // đứng yên nếu chunk chưa sinh — tránh kích hoạt sinh chunk giữa frame gây giật
    if (!world.peekChunk(Math.floor(this.pos.x / CHUNK), Math.floor(this.pos.z / CHUNK))) return;

    const toPlayer = new THREE.Vector3().subVectors(player.pos, this.pos);
    const dist = toPlayer.length();
    this.attackCd -= dt;

    if (this.type === 'creeper') {
      if (this.fuse >= 0) {
        this.fuse -= dt;
        const f = Math.sin(performance.now() / 50) > 0 ? 1.25 : 1;
        this.group.scale.set(f, 1 + (1.5 - this.fuse) * 0.12, f);
        if (dist > 5) { this.fuse = -1; this.group.scale.set(1, 1, 1); }
        else if (this.fuse <= 0) {
          explode(this.pos.x, this.pos.y + 0.8, this.pos.z, 3.2, 14);
          this.remove();
          return;
        }
      } else if (dist < 2.4 && !player.dead) {
        this.fuse = 1.5;
        sndFuse();
      }
    }

    if (this.type === 'zombie' && dist < 22) {
      this.groanTimer -= dt;
      if (this.groanTimer <= 0) {
        this.groanTimer = 4 + Math.random() * 6;
        sndZombieGroan(Math.max(0.02, 0.13 * (1 - dist / 24)));
      }
    }
    if (isPassive(this.type) && dist < 18) {
      this.groanTimer -= dt;
      if (this.groanTimer <= 0) {
        this.groanTimer = 8 + Math.random() * 10;
        const v = Math.max(0.02, 0.1 * (1 - dist / 20));
        if (this.type === 'horse') sndHorseNeigh(v);
        else if (this.type === 'pig') sndOink(v);
        else if (this.type === 'cow') sndMoo(v);
        else if (this.type === 'chicken') sndCluck(v * 0.8);
        else if (this.type === 'sheep') sndBaa(v);
      }
    }

    // AI di chuyển (động vật hiền chỉ đi lang thang)
    let desire = 0;
    if (!isPassive(this.type) && dist < this.detect && !player.dead) {
      this.heading = Math.atan2(toPlayer.x, toPlayer.z);
      desire = (this.type === 'creeper' && this.fuse >= 0) ? 0 : this.speed;
    } else {
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = 2 + Math.random() * 4;
        this.heading = Math.random() * Math.PI * 2;
        this.idle = Math.random() < (isPassive(this.type) ? 0.6 : 0.4);
      }
      desire = this.idle ? 0 : this.speed * 0.5;
    }
    this.vel.x = Math.sin(this.heading) * desire;
    this.vel.z = Math.cos(this.heading) * desire;
    this.vel.y -= GRAVITY * dt;
    if (this.vel.y < -40) this.vel.y = -40;

    const res = moveEntity(this, dt);
    if ((res.hitX || res.hitZ) && this.onGround) this.vel.y = 7.6;

    if (this.type === 'zombie' && dist < 1.6 && this.attackCd <= 0 && !player.dead) {
      this.attackCd = 1.1;
      damagePlayer(3, this.pos);
    }

    this.group.position.copy(this.pos);
    this.group.rotation.y = this.heading;
    this.walkPhase += dt * (desire > 0 ? 7 : 0);
    const sw = Math.sin(this.walkPhase) * 0.6;
    this.legs.forEach((leg, i) => { leg.rotation.x = i % 2 === 0 ? sw : -sw; });

    if (this.flashUntil > 0 && performance.now() > this.flashUntil) {
      this.flashUntil = 0;
      this.setEmissive(0);
    }
  }

  setEmissive(hex: number): void {
    this.group.traverse(o => {
      if ((o as THREE.Mesh).isMesh) {
        const mesh = o as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach(m => { const lm = m as THREE.MeshLambertMaterial; if (lm.emissive) lm.emissive.setHex(hex); });
      }
    });
  }

  damage(amount: number, fromPos?: THREE.Vector3): void {
    this.hp -= amount;
    sndHit();
    if (this.type === 'horse') sndHorseNeigh(0.12);
    else if (this.type === 'pig') sndOink(0.13);
    else if (this.type === 'cow') sndMoo(0.12);
    else if (this.type === 'chicken') sndCluck(0.12);
    else if (this.type === 'sheep') sndBaa(0.12);
    this.flashUntil = performance.now() + 140;
    this.setEmissive(0xaa0000);
    if (fromPos) {
      const dir = new THREE.Vector3().subVectors(this.pos, fromPos).setY(0).normalize();
      this.vel.x += dir.x * 6; this.vel.z += dir.z * 6; this.vel.y += 4.5;
    }
    if (this.hp <= 0) {
      sndMobDeath();
      if (player.riding === this) {
        player.riding = null;
        player.vel.set(0, 0, 0);
      }
      for (let i = 0; i < 20; i++) {
        spawnParticle(this.pos.x, this.pos.y + 0.8, this.pos.z,
          (Math.random() - 0.5) * 5, Math.random() * 5, (Math.random() - 0.5) * 5,
          0.35, 0.7, 0.3, 0.8);
      }
      this.remove();
    }
  }

  remove(): void {
    scene.remove(this.group);
    const i = mobs.indexOf(this);
    if (i >= 0) mobs.splice(i, 1);
  }
}

/** spawn mob tại vị trí (dùng cho trứng spawn trong inventory) */
export function spawnMobAt(type: MobType, x: number, y: number, z: number): Mob {
  const m = new Mob(type, x, y, z);
  mobs.push(m);
  return m;
}

const MAX_PASSIVE = 16; // tổng động vật hiền quanh người chơi
let spawnTimer = 0;
function updateMobSpawning(dt: number): void {
  if (getCurrentDimension() !== 'overworld') return;
  spawnTimer -= dt;
  if (spawnTimer > 0) return;
  spawnTimer = 2.2;
  const night = sunElevation() < 0.05;
  const passives = mobs.filter(m => isPassive(m.type)).length;
  const horses = mobs.filter(m => m.type === 'horse').length;
  const hostiles = mobs.length - passives;

  const ang = Math.random() * Math.PI * 2;
  const d = 20 + Math.random() * 24;
  const x = Math.floor(player.pos.x + Math.cos(ang) * d);
  const z = Math.floor(player.pos.z + Math.sin(ang) * d);
  const h = terrainHeight(x, z);
  if (h <= SEA_LEVEL) return;

  const nearPark = isNearThemePark(x, z);
  const passiveLimit = nearPark ? MAX_PASSIVE + 6 : MAX_PASSIVE;

  // ban ngày: ưu tiên spawn động vật hiền (thường theo cặp cho sống động)
  if (!night && passives < passiveLimit && Math.random() < (nearPark ? 0.8 : 0.65) && h < 44) {
    // ngựa được ưu tiên khi còn ít
    const type: MobType = (horses < MAX_HORSES && Math.random() < (nearPark ? 0.5 : 0.35))
      ? 'horse'
      : PASSIVE_TYPES[1 + (Math.random() * 4 | 0)]; // pig/cow/chicken/sheep
    mobs.push(new Mob(type, x + 0.5, h + 1.2, z + 0.5));
    if (type !== 'horse' && Math.random() < 0.5 && passives + 1 < passiveLimit) {
      mobs.push(new Mob(type, x + 2, h + 1.2, z + 1.5)); // bạn đồng hành
    }
    return;
  }
  if (hostiles >= MAX_MOBS || Math.random() > (night ? 0.85 : 0.3)) return;
  const type: MobType = Math.random() < 0.65 ? 'zombie' : 'creeper';
  mobs.push(new Mob(type, x + 0.5, h + 1.2, z + 0.5));
}

export function updateMobs(dt: number): void {
  updateMobSpawning(dt);
  for (let i = mobs.length - 1; i >= 0; i--) {
    const m = mobs[i];
    if (!m.ridden && (m.pos.distanceTo(player.pos) > 75 || m.pos.y < -10)) { m.remove(); continue; }
    m.update(dt);
  }
}
