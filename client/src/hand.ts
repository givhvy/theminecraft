// Vật phẩm cầm trên tay (view model) + animation vung tay, bobbing
import * as THREE from 'three';
import { B } from '@shared/blocks';
import { tileToDataURL } from './textures';
import { camera } from './scene';
import { heldItem, uiEvents } from './ui';
import { player } from './player';

const handGroup = new THREE.Group();
camera.add(handGroup);
handGroup.position.set(0.42, -0.38, -0.65);

let handMesh: THREE.Object3D | null = null;
let swingT = 1;
const handTexCache: Record<string, THREE.Texture> = {};

export function buildHandItem(): void {
  if (handMesh) handGroup.remove(handMesh);
  const it = heldItem();
  if (it.kind === 'block') {
    const k = 'b' + it.id;
    if (!handTexCache[k]) {
      const img = new Image();
      const tex = new THREE.Texture();
      img.onload = () => { tex.image = img; tex.needsUpdate = true; };
      img.src = tileToDataURL(B[it.id].tiles.side);
      tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
      tex.colorSpace = THREE.SRGBColorSpace;
      handTexCache[k] = tex;
    }
    handMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.3, 0.3),
      new THREE.MeshLambertMaterial({
        map: handTexCache[k],
        transparent: B[it.id].transparent || B[it.id].liquid,
        opacity: B[it.id].liquid ? 0.75 : 1,
      })
    );
  } else if (it.kind === 'boat') {
    const g = new THREE.Group();
    const wood = new THREE.MeshLambertMaterial({ color: 0x8a6336 });
    const hull = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.4), wood);
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.4), wood);
    side.position.set(-0.1, 0.07, 0);
    const side2 = side.clone(); side2.position.x = 0.1;
    g.add(hull, side, side2);
    g.rotation.z = -0.3;
    handMesh = g;
  } else {
    const g = new THREE.Group();
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x8a6336 });
    const steelMat = new THREE.MeshLambertMaterial({ color: 0xcfd6dd });
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.05), woodMat);
    handle.position.y = -0.05;
    g.add(handle);
    let head: THREE.Mesh;
    if (it.id === 'sword') {
      head = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.42, 0.025), steelMat);
      head.position.y = 0.33;
    } else if (it.id === 'pickaxe') {
      head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.05), steelMat);
      head.position.y = 0.18;
    } else if (it.id === 'axe') {
      head = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.05), steelMat);
      head.position.set(0.07, 0.16, 0);
    } else {
      head = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.04), steelMat);
      head.position.y = 0.2;
    }
    g.add(head);
    g.rotation.z = -0.4;
    handMesh = g;
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
