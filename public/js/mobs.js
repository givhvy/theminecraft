// Zombie & Creeper: mô hình, AI, sát thương, âm thanh
import * as THREE from 'three';
import { GRAVITY, MAX_MOBS, SEA_LEVEL } from './config.js';
import { world } from './world.js';
import { terrainHeight } from './noise.js';
import { moveEntity } from './physics.js';
import { scene, sunElevation } from './scene.js';
import { player, damagePlayer } from './player.js';
import { mobs } from './entities.js';
import { explode } from './tnt.js';
import { spawnParticle } from './particles.js';
import { sndHit, sndFuse, sndZombieGroan, sndMobDeath } from './audio.js';

function makeFaceTexture(draw) {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  draw(c.getContext('2d'));
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

function box(w, h, d, color, faceTex) {
  let mat;
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

export class Mob {
  constructor(type, x, y, z) {
    this.type = type;
    this.pos = new THREE.Vector3(x, y, z);
    this.vel = new THREE.Vector3();
    this.onGround = false;
    this.hp = 20;
    this.wanderTimer = 0;
    this.groanTimer = 3 + Math.random() * 6;
    this.heading = Math.random() * Math.PI * 2;
    this.attackCd = 0;
    this.fuse = -1;
    this.walkPhase = 0;
    this.flashUntil = 0;
    this.idle = false;
    this.group = new THREE.Group();
    this.group.userData.mob = this;
    this.parts = {};

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
      this.parts = { head, armL, armR, legL, legR };
    } else {
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
    }
    scene.add(this.group);
  }

  update(dt) {
    const toPlayer = new THREE.Vector3().subVectors(player.pos, this.pos);
    const dist = toPlayer.length();
    this.attackCd -= dt;

    // creeper xì và nổ
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

    // zombie rên rỉ khi ở gần
    if (this.type === 'zombie' && dist < 22) {
      this.groanTimer -= dt;
      if (this.groanTimer <= 0) {
        this.groanTimer = 4 + Math.random() * 6;
        sndZombieGroan(Math.max(0.02, 0.13 * (1 - dist / 24)));
      }
    }

    // AI di chuyển
    let desire = 0;
    if (dist < this.detect && !player.dead) {
      this.heading = Math.atan2(toPlayer.x, toPlayer.z);
      desire = (this.type === 'creeper' && this.fuse >= 0) ? 0 : this.speed;
    } else {
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = 2 + Math.random() * 4;
        this.heading = Math.random() * Math.PI * 2;
        this.idle = Math.random() < 0.4;
      }
      desire = this.idle ? 0 : this.speed * 0.5;
    }
    this.vel.x = Math.sin(this.heading) * desire;
    this.vel.z = Math.cos(this.heading) * desire;
    this.vel.y -= GRAVITY * dt;
    if (this.vel.y < -40) this.vel.y = -40;

    const res = moveEntity(this, dt);
    if ((res.hitX || res.hitZ) && this.onGround) this.vel.y = 7.6;

    // zombie cắn
    if (this.type === 'zombie' && dist < 1.6 && this.attackCd <= 0 && !player.dead) {
      this.attackCd = 1.1;
      damagePlayer(3, this.pos);
    }

    // hiển thị
    this.group.position.copy(this.pos);
    this.group.rotation.y = this.heading;
    this.walkPhase += dt * (desire > 0 ? 7 : 0);
    const sw = Math.sin(this.walkPhase) * 0.6;
    if (this.type === 'zombie') {
      this.parts.legL.rotation.x = sw;
      this.parts.legR.rotation.x = -sw;
    }
    if (this.flashUntil > 0 && performance.now() > this.flashUntil) {
      this.flashUntil = 0;
      this.setEmissive(0);
    }
  }

  setEmissive(hex) {
    this.group.traverse(o => {
      if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.emissive && m.emissive.setHex(hex));
    });
  }

  damage(amount, fromPos) {
    this.hp -= amount;
    sndHit();
    this.flashUntil = performance.now() + 140;
    this.setEmissive(0xaa0000);
    if (fromPos) {
      const dir = new THREE.Vector3().subVectors(this.pos, fromPos).setY(0).normalize();
      this.vel.x += dir.x * 6; this.vel.z += dir.z * 6; this.vel.y += 4.5;
    }
    if (this.hp <= 0) {
      sndMobDeath();
      for (let i = 0; i < 20; i++) {
        spawnParticle(this.pos.x, this.pos.y + 0.8, this.pos.z,
          (Math.random() - 0.5) * 5, Math.random() * 5, (Math.random() - 0.5) * 5,
          0.35, 0.7, 0.3, 0.8);
      }
      this.remove();
    }
  }

  remove() {
    scene.remove(this.group);
    const i = mobs.indexOf(this);
    if (i >= 0) mobs.splice(i, 1);
  }
}

let spawnTimer = 0;
function updateMobSpawning(dt) {
  spawnTimer -= dt;
  if (spawnTimer > 0) return;
  spawnTimer = 3.5;
  const night = sunElevation() < 0.05;
  if (mobs.length >= MAX_MOBS || Math.random() > (night ? 0.85 : 0.3)) return;
  const ang = Math.random() * Math.PI * 2;
  const d = 24 + Math.random() * 20;
  const x = Math.floor(player.pos.x + Math.cos(ang) * d);
  const z = Math.floor(player.pos.z + Math.sin(ang) * d);
  const h = terrainHeight(x, z);
  if (h <= SEA_LEVEL) return;
  const type = Math.random() < 0.65 ? 'zombie' : 'creeper';
  mobs.push(new Mob(type, x + 0.5, h + 1.2, z + 0.5));
}

export function updateMobs(dt) {
  updateMobSpawning(dt);
  for (let i = mobs.length - 1; i >= 0; i--) {
    const m = mobs[i];
    if (m.pos.distanceTo(player.pos) > 75 || m.pos.y < -10) { m.remove(); continue; }
    m.update(dt);
  }
}
