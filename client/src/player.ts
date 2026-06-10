// Người chơi: di chuyển, máu, hồi sinh, bơi, cưỡi ngựa/thuyền, âm thanh hành động
import * as THREE from 'three';
import { GRAVITY, JUMP_SPEED, WALK_SPEED, FLY_SPEED, SEA_LEVEL } from '@shared/config';
import { AIR } from '@shared/blocks';
import { world } from '@shared/world';
import { terrainHeight } from '@shared/noise';
import { moveEntity, inWater } from '@shared/physics';
import { camera } from './scene';
import { updateHearts, flashVignette, deathscreen } from './ui';
import {
  sndHurt, sndStep, sndJump, sndLand, sndSplash,
  sndGallop, sndPaddle, sndDismount,
} from './audio';

/** thực thể có thể cưỡi (ngựa hoặc thuyền) */
export interface Rideable {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  halfW: number;
  height: number;
  onGround: boolean;
  seatHeight: number;
  rideSpeed: number;
  rideKind: 'horse' | 'boat';
  heading: number;
  ridden: boolean;
}

export const player = {
  pos: new THREE.Vector3(), vel: new THREE.Vector3(),
  yaw: 0, pitch: 0, onGround: false, flying: false,
  halfW: 0.3, height: 1.8, eye: 1.62,
  hp: 20, maxHp: 20, dead: false, lastDamage: -99,
  walkTime: 0, stepDist: 0, wasInWater: false,
  riding: null as Rideable | null,
};
let gameTime = 0;
export function getGameTime(): number { return gameTime; }

export function findSpawn(): THREE.Vector3 {
  for (let r = 0; r < 40; r++) for (let a = 0; a < 8; a++) {
    const x = 8 + Math.round(Math.cos(a) * r * 6), z = 8 + Math.round(Math.sin(a) * r * 6);
    const h = terrainHeight(x, z);
    if (h > SEA_LEVEL + 1) return new THREE.Vector3(x + 0.5, h + 2.5, z + 0.5);
  }
  return new THREE.Vector3(8.5, terrainHeight(8, 8) + 2.5, 8.5);
}

export function damagePlayer(amount: number, fromPos?: THREE.Vector3): void {
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
function die(): void {
  player.dead = true;
  dismount();
  document.exitPointerLock();
  deathscreen.style.display = 'flex';
}
export function respawn(): void {
  player.hp = player.maxHp;
  player.dead = false;
  player.pos.copy(findSpawn());
  player.vel.set(0, 0, 0);
  updateHearts(player.hp);
  deathscreen.style.display = 'none';
}
updateHearts(player.hp);

export function mount(entity: Rideable): void {
  player.riding = entity;
  entity.ridden = true;
}
export function dismount(): void {
  if (!player.riding) return;
  const e = player.riding;
  e.ridden = false;
  player.riding = null;
  player.pos.set(e.pos.x + 1.2, e.pos.y + 0.8, e.pos.z);
  player.vel.set(0, 0, 0);
  sndDismount();
}

type Keys = Record<string, boolean | undefined>;

let rideStepDist = 0;

function updateRiding(dt: number, keys: Keys): void {
  const e = player.riding!;
  const sin = Math.sin(player.yaw), cos = Math.cos(player.yaw);
  let fwd = 0, strafe = 0;
  if (keys['KeyW']) fwd += 1;
  if (keys['KeyS']) fwd -= 1;
  if (keys['KeyA']) strafe -= 1;
  if (keys['KeyD']) strafe += 1;
  const len = Math.hypot(fwd, strafe) || 1;
  const speed = e.rideSpeed;
  e.vel.x = (-sin * fwd / len + cos * strafe / len) * speed;
  e.vel.z = (-cos * fwd / len - sin * strafe / len) * speed;
  const moving = fwd !== 0 || strafe !== 0;
  if (moving) e.heading = Math.atan2(e.vel.x, e.vel.z);

  if (e.rideKind === 'horse') {
    e.vel.y -= GRAVITY * dt;
    if (e.vel.y < -45) e.vel.y = -45;
    if (keys['Space'] && e.onGround) { e.vel.y = 9; sndJump(); }
    const before = new THREE.Vector3(e.pos.x, 0, e.pos.z);
    const res = moveEntity(e, dt);
    if ((res.hitX || res.hitZ) && e.onGround) e.vel.y = 8; // tự nhảy lên block
    if (e.onGround && moving) {
      rideStepDist += before.distanceTo(new THREE.Vector3(e.pos.x, 0, e.pos.z));
      if (rideStepDist > 2.6) { rideStepDist = 0; sndGallop(); }
    }
  }
  // (thuyền tự xử lý vật lý nổi trong boat.ts; ở đây chỉ set vận tốc + heading)
  if (e.rideKind === 'boat' && moving) {
    rideStepDist += speed * dt;
    if (rideStepDist > 5) { rideStepDist = 0; sndPaddle(); }
  }

  player.pos.set(e.pos.x, e.pos.y + e.seatHeight, e.pos.z);
  player.vel.set(0, 0, 0);
}

export function updatePlayer(dt: number, keys: Keys): void {
  gameTime += dt;
  player.walkTime += dt;

  if (player.riding) {
    updateRiding(dt, keys);
  } else {
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

    const before = new THREE.Vector3(player.pos.x, 0, player.pos.z);
    const res = moveEntity(player, dt);

    if (player.onGround && !swimming) {
      player.stepDist += before.distanceTo(new THREE.Vector3(player.pos.x, 0, player.pos.z));
      if (player.stepDist > 2.1) {
        player.stepDist = 0;
        const under = world.getBlock(Math.floor(player.pos.x), Math.floor(player.pos.y - 0.5), Math.floor(player.pos.z));
        if (under !== AIR) sndStep(under);
      }
    }

    if (res.landed && !player.flying && !swimming) {
      if (res.prevVy < -13) {
        damagePlayer(Math.round((-res.prevVy - 13) * 0.9));
        sndLand(2);
      } else if (res.prevVy < -7) {
        sndLand(1);
      }
    }
    if (player.pos.y < -20) { player.pos.copy(findSpawn()); player.vel.set(0, 0, 0); }
  }

  // hồi máu chậm
  if (player.hp < player.maxHp && gameTime - player.lastDamage > 8 && (gameTime % 4) < dt) {
    player.hp = Math.min(player.hp + 1, player.maxHp);
    updateHearts(player.hp);
  }

  camera.position.set(player.pos.x, player.pos.y + player.eye, player.pos.z);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;
}
