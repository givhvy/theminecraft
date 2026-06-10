// Renderer, camera, ánh sáng, bầu trời, ngày/đêm, mây
import * as THREE from 'three';
import { CHUNK, RENDER_DIST, DAY_LENGTH } from './config.js';
import { rand01 } from './noise.js';

export const canvas = document.getElementById('game');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 700);
scene.add(camera);

const DAY_SKY = new THREE.Color(0x8fc8ee), NIGHT_SKY = new THREE.Color(0x0a1228), DUSK_SKY = new THREE.Color(0xe8915a);
const skyColor = new THREE.Color();
scene.background = skyColor;
scene.fog = new THREE.Fog(skyColor, RENDER_DIST * CHUNK * 0.5, RENDER_DIST * CHUNK * 0.95);

export const sun = new THREE.DirectionalLight(0xfff2d8, 1.2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -70; sun.shadow.camera.right = 70;
sun.shadow.camera.top = 70; sun.shadow.camera.bottom = -70;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 250;
sun.shadow.bias = -0.0006;
scene.add(sun); scene.add(sun.target);

const ambient = new THREE.AmbientLight(0xbfd4ff, 0.5);
scene.add(ambient);
const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x9a7a52, 0.45);
scene.add(hemi);

// mây
const cloudGroup = new THREE.Group();
const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
for (let i = 0; i < 22; i++) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(12 + rand01(i * 3) * 22, 1.6, 8 + rand01(i * 7) * 18), cloudMat);
  m.position.set((rand01(i) - 0.5) * 420, 64 + rand01(i * 13) * 8, (rand01(i * 31) - 0.5) * 420);
  cloudGroup.add(m);
}
scene.add(cloudGroup);

// khung block đang nhắm
export const highlight = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002)),
  new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6 })
);
highlight.visible = false;
scene.add(highlight);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---- ngày / đêm ----
let dayTime = 0.3; // bắt đầu buổi sáng
export function sunElevation() { return Math.sin(dayTime * Math.PI * 2); }
export function getDayTime() { return dayTime; }

const tmpColor = new THREE.Color();
export function updateDayNight(dt, playerPos) {
  dayTime = (dayTime + dt / DAY_LENGTH) % 1;
  const el = sunElevation();
  const dayF = THREE.MathUtils.clamp(el * 3 + 0.15, 0, 1);
  const duskF = THREE.MathUtils.clamp(1 - Math.abs(el) * 5, 0, 1);

  skyColor.copy(NIGHT_SKY).lerp(DAY_SKY, dayF);
  if (duskF > 0) { tmpColor.copy(DUSK_SKY); skyColor.lerp(tmpColor, duskF * 0.45); }
  scene.fog.color.copy(skyColor);

  const ang = (dayTime - 0.25) * Math.PI * 2;
  const sunDir = new THREE.Vector3(Math.cos(ang), Math.sin(ang), 0.3).normalize();
  sun.position.copy(playerPos).addScaledVector(sunDir, 110);
  sun.target.position.copy(playerPos);
  sun.intensity = Math.max(el, 0) * 1.35 + 0.06;
  sun.color.setHSL(0.12, duskF * 0.6 + 0.15, 0.95 - duskF * 0.25);
  ambient.intensity = 0.16 + dayF * 0.38;
  hemi.intensity = 0.12 + dayF * 0.38;

  cloudGroup.position.x += dt * 1.1;
  if (cloudGroup.position.x - playerPos.x > 220) cloudGroup.position.x = playerPos.x - 220;
}
