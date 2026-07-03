// Render icon 3D offscreen cho block/tool bằng Three.js
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { B } from '@shared/blocks';
import { atlasTex, NTILES } from './textures';
import { makeToolModel, makeBoatModel, makeIgniterModel, makeEggModel } from './models';
import type { Item } from './ui';

const SIZE = 128;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setSize(SIZE, SIZE);
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
// môi trường phản chiếu — kim loại/kim cương bóng thật
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 10);
camera.position.set(1.55, 1.15, 1.55);
camera.lookAt(0, 0.05, 0);

const amb = new THREE.AmbientLight(0xffffff, 0.65);
const key = new THREE.DirectionalLight(0xfff8ee, 1.35);
key.position.set(2.5, 4, 2);
const fill = new THREE.DirectionalLight(0x8899cc, 0.45);
fill.position.set(-2, 1, -1);
const rim = new THREE.DirectionalLight(0xffffff, 0.7);
rim.position.set(-1.5, 2.5, -3);
scene.add(amb, key, fill, rim);

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
  // isometric chuẩn Minecraft: quay đúng 45°, không lệch
  mesh.rotation.y = Math.PI / 4;
  mesh.rotation.x = -0.48;
  return mesh;
}

const NUM_LIGHTS = 4;
function renderObject(obj: THREE.Object3D): string {
  while (scene.children.length > NUM_LIGHTS) scene.remove(scene.children[NUM_LIGHTS]);
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
  if (item.kind === 'tool') {
    // dụng cụ đứng thẳng, xoay nhẹ cho thấy khối 3D
    obj = makeToolModel(item.id);
    obj.rotation.z = -0.1;
    obj.rotation.y = 0.55;
    obj.rotation.x = -0.06;
    obj.position.y = -0.16;
    obj.scale.setScalar(1.22);
  } else if (item.kind === 'boat') {
    obj = makeBoatModel();
    obj.rotation.y = Math.PI / 4;
    obj.rotation.x = -0.12;
    obj.scale.setScalar(0.9);
  } else if (item.kind === 'igniter') {
    obj = makeIgniterModel();
    obj.rotation.y = 0.4;
    obj.scale.setScalar(1.6);
  } else if (item.kind === 'egg') {
    obj = makeEggModel(item.id);
    obj.scale.setScalar(1.5);
    obj.rotation.z = -0.12;
  } else obj = makeBlockMesh(item.id);
  cache[k] = renderObject(obj);
  return cache[k];
}
