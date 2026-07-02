// Viewmodel 3D cầm trên tay + animation vung tay, bobbing
import * as THREE from 'three';
import { B } from '@shared/blocks';
import { atlasTex, NTILES } from './textures';
import { camera } from './scene';
import { heldItem, uiEvents } from './ui';
import { player } from './player';

const handGroup = new THREE.Group();
camera.add(handGroup);
handGroup.position.set(0.42, -0.38, -0.65);

let handMesh: THREE.Object3D | null = null;
let swingT = 1;

const woodMat = new THREE.MeshLambertMaterial({ color: 0x8a6336 });
const steelMat = new THREE.MeshStandardMaterial({ color: 0xd8e0e8, metalness: 0.7, roughness: 0.3 });

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

function buildToolModel(toolId: string): THREE.Group {
  const g = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.5, 8), woodMat);
  handle.position.y = -0.06;
  g.add(handle);

  if (toolId === 'sword') {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.02), steelMat);
    blade.position.y = 0.32;
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.04), steelMat);
    guard.position.y = 0.1;
    g.add(blade, guard);
  } else if (toolId === 'pickaxe') {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.05), steelMat);
    head.position.y = 0.18;
    const pick = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.05), steelMat);
    pick.position.y = 0.14;
    g.add(head, pick);
  } else if (toolId === 'axe') {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.04), steelMat);
    head.position.set(0.07, 0.16, 0);
    g.add(head);
  } else {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.035), steelMat);
    head.position.y = 0.2;
    g.add(head);
  }
  g.rotation.z = -0.45;
  return g;
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
    const g = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.45), woodMat);
    const bow = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.45), woodMat);
    bow.position.set(-0.14, 0.06, 0);
    const oar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 6), new THREE.MeshLambertMaterial({ color: 0xa8804f }));
    oar.position.set(0.12, 0.14, 0); oar.rotation.z = -0.5;
    g.add(hull, bow, oar);
    g.rotation.z = -0.3;
    handMesh = g;
  } else if (it.kind === 'igniter') {
    const g = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.38, 8), new THREE.MeshLambertMaterial({ color: 0x444444 }));
    handle.rotation.x = Math.PI / 2;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 8), new THREE.MeshBasicMaterial({ color: 0xff6600 }));
    flame.position.set(0, 0, -0.24);
    g.add(handle, flame);
    g.rotation.x = -0.45;
    handMesh = g;
  } else {
    handMesh = buildToolModel(it.id);
  }
  handGroup.add(handMesh);
}
buildHandItem();
uiEvents.addEventListener('slotchange', buildHandItem);

export function updateHand(dt: number, keys: Record<string, boolean | undefined>): void {
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
