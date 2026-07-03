// Viewmodel 3D cầm trên tay + animation vung tay, bobbing
import * as THREE from 'three';
import { B } from '@shared/blocks';
import { atlasTex, NTILES } from './textures';
import { camera } from './scene';
import { makeToolModel, makeBoatModel, makeIgniterModel, makeEggModel } from './models';
import { heldItem, uiEvents } from './ui';
import { player } from './player';

const handGroup = new THREE.Group();
camera.add(handGroup);
handGroup.position.set(0.42, -0.38, -0.65);

let handMesh: THREE.Object3D | null = null;
let swingT = 1;

function blockMat(blockId: number, face: 'top' | 'bottom' | 'side'): THREE.MeshLambertMaterial {
  const tile = B[blockId].tiles[face];
  const tex = atlasTex.clone();
  tex.repeat.set(1 / NTILES, 1);
  tex.offset.set(tile / NTILES, 0);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshLambertMaterial({
    map: tex,
    transparent: B[blockId].transparent || B[blockId].liquid,
    opacity: B[blockId].liquid ? 0.75 : 1,
  });
}

export function buildHandItem(): void {
  if (handMesh) handGroup.remove(handMesh);
  const it = heldItem();

  if (it.kind === 'block') {
    const mats = [
      blockMat(it.id, 'side'), blockMat(it.id, 'side'),
      blockMat(it.id, 'top'), blockMat(it.id, 'bottom'),
      blockMat(it.id, 'side'), blockMat(it.id, 'side'),
    ];
    handMesh = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), mats);
    handMesh.rotation.y = Math.PI / 4;
  } else if (it.kind === 'boat') {
    const g = makeBoatModel();
    g.scale.setScalar(0.5);
    g.rotation.z = -0.25;
    g.rotation.y = 0.35;
    handMesh = g;
  } else if (it.kind === 'igniter') {
    const g = makeIgniterModel();
    g.scale.setScalar(0.8);
    g.rotation.x = -0.3;
    g.rotation.y = 0.5;
    handMesh = g;
  } else if (it.kind === 'egg') {
    const g = makeEggModel(it.id);
    g.scale.setScalar(0.75);
    handMesh = g;
  } else {
    const g = makeToolModel(it.id);
    g.scale.setScalar(0.78);
    // kiếm: lộ mặt lưỡi; rìu/cúp/xẻng: lưỡi hướng về trước như cầm thật
    if (it.id.includes('sword')) {
      g.rotation.z = -0.5;
      g.rotation.y = -0.2;
    } else {
      g.rotation.y = -Math.PI / 2 + 0.28; // đầu dụng cụ quay ra trước
      g.rotation.z = -0.42;
      g.rotation.x = 0.1;
    }
    handMesh = g;
  }
  handGroup.add(handMesh);
}
buildHandItem();
uiEvents.addEventListener('slotchange', buildHandItem);

export function updateHand(dt: number, keys: Record<string, boolean | undefined>): void {
  handGroup.visible = !document.body.classList.contains('menu'); // ẩn ở màn hình chính
  if (swingT < 1) swingT = Math.min(swingT + dt / 0.25, 1);
  const swing = Math.sin(swingT * Math.PI);
  const moving = (keys['KeyW'] || keys['KeyA'] || keys['KeyS'] || keys['KeyD']) && player.onGround;
  const bob = moving ? Math.sin(player.walkTime * 9) * 0.018 : 0;
  handGroup.position.set(0.42, -0.38 + bob, -0.65);
  handGroup.rotation.x = -swing * 1.1;
  handGroup.rotation.y = -swing * 0.4;
}
export function swingHand(): void { if (swingT >= 1) swingT = 0; }
export function isSwinging(): boolean { return swingT < 1; }
