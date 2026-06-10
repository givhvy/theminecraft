// Người chơi: trạng thái, di chuyển, máu, hồi sinh, âm thanh bước chân
import * as THREE from 'three';
import { GRAVITY, JUMP_SPEED, WALK_SPEED, FLY_SPEED, SEA_LEVEL } from './config.js';
import { AIR } from './blocks.js';
import { world } from './world.js';
import { terrainHeight } from './noise.js';
import { moveEntity, inWater } from './physics.js';
import { camera } from './scene.js';
import { updateHearts, flashVignette, deathscreen } from './ui.js';
import { sndHurt, sndStep, sndJump, sndLand, sndSplash } from './audio.js';

export const player = {
  pos: new THREE.Vector3(), vel: new THREE.Vector3(),
  yaw: 0, pitch: 0, onGround: false, flying: false,
  halfW: 0.3, height: 1.8, eye: 1.62,
  hp: 20, maxHp: 20, dead: false, lastDamage: -99,
  walkTime: 0, stepDist: 0, wasInWater: false,
};
let gameTime = 0;
export function getGameTime() { return gameTime; }

export function findSpawn() {
  for (let r = 0; r < 40; r++) for (let a = 0; a < 8; a++) {
    const x = 8 + Math.round(Math.cos(a) * r * 6), z = 8 + Math.round(Math.sin(a) * r * 6);
    const h = terrainHeight(x, z);
    if (h > SEA_LEVEL + 1) return new THREE.Vector3(x + 0.5, h + 2.5, z + 0.5);
  }
  return new THREE.Vector3(8.5, terrainHeight(8, 8) + 2.5, 8.5);
}

export function damagePlayer(amount, fromPos) {
  if (player.dead || amount <= 0) return;
  player.hp -= amount;
  player.lastDamage = gameTime;
  sndHurt();
  flashVignette();
  if (fromPos) {
    const dir = new THREE.Vector3().subVectors(player.pos, fromPos).setY(0).normalize();
    player.vel.x += dir.x * 7; player.vel.z += dir.z * 7; player.vel.y += 4;
  }
  updateHearts(player.hp);
  if (player.hp <= 0) die();
}
function die() {
  player.dead = true;
  document.exitPointerLock();
  deathscreen.style.display = 'flex';
}
export function respawn() {
  player.hp = player.maxHp;
  player.dead = false;
  player.pos.copy(findSpawn());
  player.vel.set(0, 0, 0);
  updateHearts(player.hp);
  deathscreen.style.display = 'none';
}
updateHearts(player.hp);

export function updatePlayer(dt, keys) {
  gameTime += dt;
  player.walkTime += dt;
  const swimming = inWater(player.pos.x, player.pos.y + 0.4, player.pos.z);
  if (swimming !== player.wasInWater) {
    if (swimming) sndSplash();
    player.wasInWater = swimming;
  }
  const speed = player.flying ? FLY_SPEED : (swimming ? WALK_SPEED * 0.55 : WALK_SPEED);
  const sin = Math.sin(player.yaw), cos = Math.cos(player.yaw);
  let fwd = 0, strafe = 0;
  if (keys['KeyW']) fwd += 1;
  if (keys['KeyS']) fwd -= 1;
  if (keys['KeyA']) strafe -= 1;
  if (keys['KeyD']) strafe += 1;
  const len = Math.hypot(fwd, strafe) || 1;
  player.vel.x = (-sin * fwd / len + cos * strafe / len) * speed;
  player.vel.z = (-cos * fwd / len - sin * strafe / len) * speed;

  if (player.flying) {
    player.vel.y = 0;
    if (keys['Space']) player.vel.y = speed;
    if (keys['ShiftLeft'] || keys['ShiftRight']) player.vel.y = -speed;
  } else if (swimming) {
    player.vel.y -= GRAVITY * 0.25 * dt;
    if (player.vel.y < -3.5) player.vel.y = -3.5;
    if (keys['Space']) player.vel.y = Math.min(player.vel.y + 22 * dt, 4);
  } else {
    player.vel.y -= GRAVITY * dt;
    if (player.vel.y < -50) player.vel.y = -50;
    if (keys['Space'] && player.onGround) {
      player.vel.y = JUMP_SPEED;
      player.onGround = false;
      sndJump();
    }
  }

  const before = player.pos.clone();
  const res = moveEntity(player, dt);

  // tiếng bước chân theo chất liệu block dưới chân
  if (player.onGround && !swimming) {
    player.stepDist += before.setY(0).distanceTo(new THREE.Vector3(player.pos.x, 0, player.pos.z));
    if (player.stepDist > 2.1) {
      player.stepDist = 0;
      const under = world.getBlock(Math.floor(player.pos.x), Math.floor(player.pos.y - 0.5), Math.floor(player.pos.z));
      if (under !== AIR) sndStep(under);
    }
  }

  // tiếp đất + sát thương rơi
  if (res.landed && !player.flying && !swimming) {
    if (res.prevVy < -13) {
      damagePlayer(Math.round((-res.prevVy - 13) * 0.9));
      sndLand(2);
    } else if (res.prevVy < -7) {
      sndLand(1);
    }
  }
  if (player.pos.y < -20) { player.pos.copy(findSpawn()); player.vel.set(0, 0, 0); }

  // hồi máu chậm khi không bị đánh
  if (player.hp < player.maxHp && gameTime - player.lastDamage > 8 && (gameTime % 4) < dt) {
    player.hp = Math.min(player.hp + 1, player.maxHp);
    updateHearts(player.hp);
  }

  camera.position.set(player.pos.x, player.pos.y + player.eye, player.pos.z);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;
}
