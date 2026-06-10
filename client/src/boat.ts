// Thuyền: đặt trên nước, cưỡi được, nổi trên mặt nước
import * as THREE from 'three';
import { BOAT_SPEED } from '@shared/config';
import { GRAVITY } from '@shared/config';
import { moveEntity, waterSurfaceY } from '@shared/physics';
import { scene } from './scene';
import { boats } from './entities';
import type { Rideable } from './player';
import { sndPlace } from './audio';

export class Boat implements Rideable {
  pos: THREE.Vector3;
  vel = new THREE.Vector3();
  halfW = 0.55;
  height = 0.5;
  onGround = false;
  seatHeight = 0.55;
  rideSpeed = BOAT_SPEED;
  rideKind = 'boat' as const;
  heading = 0;
  ridden = false;
  group: THREE.Group;

  constructor(x: number, y: number, z: number) {
    this.pos = new THREE.Vector3(x, y, z);
    this.group = new THREE.Group();
    this.group.userData.boat = this;
    const wood = new THREE.MeshLambertMaterial({ color: 0x8a6336 });
    const woodD = new THREE.MeshLambertMaterial({ color: 0x6e4f2b });
    const hull = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 1.6), woodD);
    hull.position.y = 0.12;
    const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 1.6), wood);
    sideL.position.set(-0.45, 0.35, 0);
    const sideR = sideL.clone(); sideR.position.x = 0.45;
    const front = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.14), wood);
    front.position.set(0, 0.35, -0.75);
    const back = front.clone(); back.position.z = 0.75;
    for (const m of [hull, sideL, sideR, front, back]) m.castShadow = true;
    this.group.add(hull, sideL, sideR, front, back);
    scene.add(this.group);
    boats.push(this);
    sndPlace(7);
  }

  update(dt: number): void {
    const surf = waterSurfaceY(this.pos.x, this.pos.y + 0.3, this.pos.z);
    if (surf >= 0) {
      // nổi: bám mặt nước, lắc lư nhẹ
      const target = surf + 0.75;
      this.pos.y += (target - this.pos.y) * Math.min(dt * 6, 1);
      this.vel.y = 0;
      this.onGround = true; // coi như "đứng vững" để cưỡi
      const e = { pos: this.pos, vel: this.vel, halfW: this.halfW, height: this.height, onGround: this.onGround };
      moveEntity(e, dt);
      this.onGround = e.onGround || surf >= 0;
    } else {
      // trên cạn: rơi, trượt chậm
      this.vel.y -= GRAVITY * dt;
      this.vel.x *= 0.8; this.vel.z *= 0.8;
      moveEntity(this, dt);
    }
    if (!this.ridden) { this.vel.x *= 0.92; this.vel.z *= 0.92; }
    const bob = this.ridden ? 0 : Math.sin(performance.now() / 600) * 0.03;
    this.group.position.set(this.pos.x, this.pos.y + bob, this.pos.z);
    this.group.rotation.y = this.heading;
  }

  remove(): void {
    scene.remove(this.group);
    const i = boats.indexOf(this);
    if (i >= 0) boats.splice(i, 1);
  }
}

export function updateBoats(dt: number): void {
  for (const b of boats) b.update(dt);
}
