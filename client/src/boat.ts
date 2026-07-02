// Thuyền nâng cấp: mũi thuyền, mái chèo, chi tiết gỗ
import * as THREE from 'three';
import { BOAT_SPEED, GRAVITY } from '@shared/config';
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
  oarPhase = 0;

  constructor(x: number, y: number, z: number) {
    this.pos = new THREE.Vector3(x, y, z);
    this.group = new THREE.Group();
    this.group.userData.boat = this;
    const wood = new THREE.MeshLambertMaterial({ color: 0x8a6336 });
    const woodD = new THREE.MeshLambertMaterial({ color: 0x6e4f2b });
    const trim = new THREE.MeshLambertMaterial({ color: 0xa8804f });

    const hull = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 1.7), woodD);
    hull.position.y = 0.11;
    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 1.2), wood);
    deck.position.set(0, 0.28, 0.1);

    const bow = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.2), trim);
    bow.position.set(0, 0.32, -0.85);
    bow.rotation.x = 0.25;

    const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.32, 1.65), wood);
    sideL.position.set(-0.48, 0.36, 0);
    const sideR = sideL.clone(); sideR.position.x = 0.48;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.32, 0.12), wood);
    back.position.set(0, 0.36, 0.82);

    this.oarGroup = new THREE.Group();
    const oarShaft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 1.1), trim);
    oarShaft.position.set(0.35, 0.5, 0);
    oarShaft.rotation.y = 0.3;
    const oarBlade = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.14), woodD);
    oarBlade.position.set(0.9, 0.5, 0.35);
    this.oarGroup.add(oarShaft, oarBlade);

    for (const m of [hull, deck, bow, sideL, sideR, back, oarShaft, oarBlade]) m.castShadow = true;
    this.group.add(hull, deck, bow, sideL, sideR, back, this.oarGroup);
    scene.add(this.group);
    boats.push(this);
    sndPlace(7);
  }

  oarGroup: THREE.Group;

  update(dt: number): void {
    const surf = waterSurfaceY(this.pos.x, this.pos.y + 0.3, this.pos.z);
    if (surf >= 0) {
      const target = surf + 0.75;
      this.pos.y += (target - this.pos.y) * Math.min(dt * 6, 1);
      this.vel.y = 0;
      this.onGround = true;
      const e = { pos: this.pos, vel: this.vel, halfW: this.halfW, height: this.height, onGround: this.onGround };
      moveEntity(e, dt);
      this.onGround = e.onGround || surf >= 0;
    } else {
      this.vel.y -= GRAVITY * dt;
      this.vel.x *= 0.8; this.vel.z *= 0.8;
      moveEntity(this, dt);
    }
    if (!this.ridden) { this.vel.x *= 0.92; this.vel.z *= 0.92; }
    const moving = Math.hypot(this.vel.x, this.vel.z) > 0.3;
    if (moving) this.oarPhase += dt * 8;
    this.oarGroup.rotation.x = moving ? Math.sin(this.oarPhase) * 0.5 : 0;
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
