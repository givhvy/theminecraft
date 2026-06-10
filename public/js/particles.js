// Hệ thống hạt (vỡ block, nổ, mob chết)
import * as THREE from 'three';
import { scene } from './scene.js';
import { B } from './blocks.js';
import { tileBaseColor } from './textures.js';

const MAX_PARTICLES = 1200;
const partPos = new Float32Array(MAX_PARTICLES * 3);
const partCol = new Float32Array(MAX_PARTICLES * 3);
const partGeo = new THREE.BufferGeometry();
partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
partGeo.setAttribute('color', new THREE.BufferAttribute(partCol, 3));
const partPoints = new THREE.Points(partGeo, new THREE.PointsMaterial({ size: 0.18, vertexColors: true }));
partPoints.frustumCulled = false;
scene.add(partPoints);
const particles = [];

export function spawnParticle(x, y, z, vx, vy, vz, r, g, b, life) {
  if (particles.length >= MAX_PARTICLES) particles.shift();
  particles.push({ x, y, z, vx, vy, vz, r, g, b, life });
}
export function spawnBlockParticles(bx, by, bz, blockId) {
  const tile = B[blockId] ? B[blockId].tiles.side : 3;
  const [r, g, b] = tileBaseColor[tile] || [128, 128, 128];
  for (let i = 0; i < 14; i++) {
    spawnParticle(
      bx + Math.random(), by + Math.random(), bz + Math.random(),
      (Math.random() - 0.5) * 4, Math.random() * 4 + 1, (Math.random() - 0.5) * 4,
      r / 255, g / 255, b / 255, 0.6 + Math.random() * 0.4
    );
  }
}
export function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    p.vy -= 14 * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
  }
  for (let i = 0; i < MAX_PARTICLES; i++) {
    if (i < particles.length) {
      const p = particles[i];
      partPos[i * 3] = p.x; partPos[i * 3 + 1] = p.y; partPos[i * 3 + 2] = p.z;
      partCol[i * 3] = p.r; partCol[i * 3 + 1] = p.g; partCol[i * 3 + 2] = p.b;
    } else {
      partPos[i * 3 + 1] = -9999;
    }
  }
  partGeo.attributes.position.needsUpdate = true;
  partGeo.attributes.color.needsUpdate = true;
  partGeo.setDrawRange(0, Math.max(particles.length, 1));
}
