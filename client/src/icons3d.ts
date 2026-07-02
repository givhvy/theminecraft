// Render icon 3D offscreen cho block/tool bằng Three.js
import * as THREE from 'three';
import { B, type ToolId } from '@shared/blocks';
import { atlasTex, NTILES } from './textures';
import type { Item } from './ui';

const SIZE = 96;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setSize(SIZE, SIZE);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 10);
camera.position.set(1.55, 1.15, 1.55);
camera.lookAt(0, 0.05, 0);

const amb = new THREE.AmbientLight(0xffffff, 0.55);
const key = new THREE.DirectionalLight(0xfff8ee, 1.1);
key.position.set(2.5, 4, 2);
const fill = new THREE.DirectionalLight(0x8899cc, 0.45);
fill.position.set(-2, 1, -1);
scene.add(amb, key, fill);

const cache: Record<string, string> = {};

function blockMaterial(blockId: number, face: 'top' | 'bottom' | 'side'): THREE.MeshLambertMaterial {
  const tile = B[blockId].tiles[face];
  const tex = atlasTex.clone();
  tex.repeat.set(1 / NTILES, 1);
  tex.offset.set(tile / NTILES, 0);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return new THREE.MeshLambertMaterial({
    map: tex,
    transparent: B[blockId].transparent || B[blockId].liquid,
    opacity: B[blockId].liquid ? 0.75 : 1,
  });
}

function makeBlockMesh(blockId: number): THREE.Mesh {
  const mats = [
    blockMaterial(blockId, 'side'), blockMaterial(blockId, 'side'),
    blockMaterial(blockId, 'top'), blockMaterial(blockId, 'bottom'),
    blockMaterial(blockId, 'side'), blockMaterial(blockId, 'side'),
  ];
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.92, 0.92), mats);
  mesh.rotation.y = Math.PI / 4 + 0.2;
  mesh.rotation.x = -0.22;
  return mesh;
}

function makeToolMesh(toolId: ToolId): THREE.Group {
  const g = new THREE.Group();
  const wood = new THREE.MeshLambertMaterial({ color: 0x8a6336 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xd8e0e8, metalness: 0.65, roughness: 0.35 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.55, 8), wood);
  handle.position.y = -0.08;
  g.add(handle);

  if (toolId === 'sword') {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.62, 0.03), steel);
    blade.position.y = 0.38;
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.05), steel);
    guard.position.y = 0.12;
    g.add(blade, guard);
  } else if (toolId === 'pickaxe') {
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.06), wood);
    shaft.position.y = 0.05;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.09, 0.09), steel);
    head.position.y = 0.32;
    const pick = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.28, 0.09), steel);
    pick.position.set(0, 0.22, 0);
    g.add(shaft, head, pick);
  } else if (toolId === 'axe') {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.06), steel);
    head.position.set(0.12, 0.22, 0);
    const bit = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.08), steel);
    bit.position.set(0.22, 0.24, 0);
    g.add(head, bit);
  } else {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.24, 0.05), steel);
    head.position.y = 0.26;
    g.add(head);
  }
  g.rotation.z = -0.4;
  g.rotation.y = Math.PI / 5;
  return g;
}

function makeBoatMesh(): THREE.Group {
  const g = new THREE.Group();
  const wood = new THREE.MeshLambertMaterial({ color: 0x8a6336 });
  const woodD = new THREE.MeshLambertMaterial({ color: 0x6e4f2b });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.9), woodD);
  hull.position.y = 0.02;
  const bow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.9), wood);
  bow.position.set(-0.3, 0.1, 0);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.06, 0.92), wood);
  rail.position.y = 0.16;
  g.add(hull, bow, rail);
  g.rotation.y = Math.PI / 4;
  g.rotation.x = -0.1;
  return g;
}

function makeIgniterMesh(): THREE.Group {
  const g = new THREE.Group();
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.45, 8),
    new THREE.MeshLambertMaterial({ color: 0x444444 }),
  );
  handle.rotation.x = Math.PI / 2;
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.1, 0.22, 8),
    new THREE.MeshBasicMaterial({ color: 0xff6600 }),
  );
  flame.position.set(0, 0, -0.3);
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.7 }),
  );
  glow.position.set(0, 0, -0.32);
  g.add(handle, flame, glow);
  g.rotation.x = -0.55;
  return g;
}

function renderObject(obj: THREE.Object3D): string {
  while (scene.children.length > 3) scene.remove(scene.children[3]);
  scene.add(obj);
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/png');
}

export function clearIcon3dCache(): void {
  for (const k of Object.keys(cache)) delete cache[k];
}

export function icon3dForItem(item: Item): string {
  const k = item.kind + ':' + ('id' in item ? item.id : '');
  if (cache[k]) return cache[k];
  let obj: THREE.Object3D;
  if (item.kind === 'tool') obj = makeToolMesh(item.id);
  else if (item.kind === 'boat') obj = makeBoatMesh();
  else if (item.kind === 'igniter') obj = makeIgniterMesh();
  else obj = makeBlockMesh(item.id);
  cache[k] = renderObject(obj);
  return cache[k];
}
