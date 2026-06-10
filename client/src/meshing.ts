// Dựng mesh chunk: face culling + ambient occlusion, 3 lớp vật liệu
import * as THREE from 'three';
import { CHUNK, HEIGHT, RENDER_DIST } from '@shared/config';
import { AIR, B } from '@shared/blocks';
import { world, type Chunk } from '@shared/world';
import { atlasTex, NTILES } from './textures';
import { scene } from './scene';

interface Face { dir: [number, number, number]; corners: [number, number, number][]; shade: number; tile: 'top' | 'bottom' | 'side' }
const FACES: Face[] = [
  { dir: [0, 1, 0],  corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]], shade: 1.0,  tile: 'top' },
  { dir: [0, -1, 0], corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]], shade: 0.55, tile: 'bottom' },
  { dir: [1, 0, 0],  corners: [[1,0,1],[1,0,0],[1,1,0],[1,1,1]], shade: 0.85, tile: 'side' },
  { dir: [-1, 0, 0], corners: [[0,0,0],[0,0,1],[0,1,1],[0,1,0]], shade: 0.85, tile: 'side' },
  { dir: [0, 0, 1],  corners: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]], shade: 0.75, tile: 'side' },
  { dir: [0, 0, -1], corners: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]], shade: 0.75, tile: 'side' },
];
const FACE_UVS = [[0, 0], [1, 0], [1, 1], [0, 1]];
const AO_LEVELS = [0.45, 0.62, 0.8, 1.0];

const matSolid = new THREE.MeshLambertMaterial({ map: atlasTex, vertexColors: true, alphaTest: 0.4 });
const matWater = new THREE.MeshLambertMaterial({ map: atlasTex, vertexColors: true, transparent: true, opacity: 0.72 });
const matGlow  = new THREE.MeshBasicMaterial({ map: atlasTex });

function vertexAO(bx: number, by: number, bz: number, face: Face, corner: [number, number, number]): number {
  const d = face.dir;
  const axis = d[0] !== 0 ? 0 : (d[1] !== 0 ? 1 : 2);
  const u = axis === 0 ? 1 : 0;
  const v = axis === 2 ? 1 : 2;
  const cell = [bx + d[0], by + d[1], bz + d[2]];
  const su = corner[u] ? 1 : -1, sv = corner[v] ? 1 : -1;
  const p1 = cell.slice(); p1[u] += su;
  const p2 = cell.slice(); p2[v] += sv;
  const p3 = cell.slice(); p3[u] += su; p3[v] += sv;
  const occ = (p: number[]) => {
    const b = world.getBlock(p[0], p[1], p[2]);
    const def = B[b];
    return (b !== AIR && def && !def.transparent && !def.liquid) ? 1 : 0;
  };
  const s1 = occ(p1), s2 = occ(p2);
  if (s1 && s2) return 0;
  return 3 - (s1 + s2 + occ(p3));
}

interface GeoBuf { positions: number[]; uvs: number[]; colors: number[]; indices: number[] }

export function buildChunkMesh(chunk: Chunk): void {
  const groups: Record<'solid' | 'water' | 'glow', GeoBuf> = {
    solid: { positions: [], uvs: [], colors: [], indices: [] },
    water: { positions: [], uvs: [], colors: [], indices: [] },
    glow:  { positions: [], uvs: [], colors: [], indices: [] },
  };
  const baseX = chunk.cx * CHUNK, baseZ = chunk.cz * CHUNK;

  for (let y = 0; y < HEIGHT; y++) for (let z = 0; z < CHUNK; z++) for (let x = 0; x < CHUNK; x++) {
    const b = chunk.data[(y * CHUNK + z) * CHUNK + x];
    if (b === AIR) continue;
    const def = B[b];
    const target = def.liquid ? groups.water : (def.emissive ? groups.glow : groups.solid);
    for (const face of FACES) {
      const nb = world.getBlock(baseX + x + face.dir[0], y + face.dir[1], baseZ + z + face.dir[2]);
      const nbDef = B[nb];
      const visible = nb === AIR || (nbDef && (nbDef.transparent || nbDef.liquid) && nb !== b);
      if (!visible) continue;
      const tileIdx = def.tiles[face.tile];
      const vi = target.positions.length / 3;
      for (let i = 0; i < 4; i++) {
        const c = face.corners[i];
        target.positions.push(baseX + x + c[0], y + c[1], baseZ + z + c[2]);
        target.uvs.push((tileIdx + FACE_UVS[i][0]) / NTILES, FACE_UVS[i][1]);
        let bright = face.shade;
        if (!def.liquid && !def.emissive) bright *= AO_LEVELS[vertexAO(baseX + x, y, baseZ + z, face, c)];
        target.colors.push(bright, bright, bright);
      }
      target.indices.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3);
    }
  }

  for (const m of chunk.meshes as THREE.Mesh[]) { scene.remove(m); m.geometry.dispose(); }
  chunk.meshes = [];

  const make = (g: GeoBuf, material: THREE.Material, shadows: boolean) => {
    if (g.indices.length === 0) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(g.positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(g.uvs, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(g.colors, 3));
    geo.setIndex(g.indices);
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = shadows;
    mesh.receiveShadow = shadows;
    (chunk.meshes as THREE.Mesh[]).push(mesh);
    scene.add(mesh);
  };
  make(groups.solid, matSolid, true);
  make(groups.water, matWater, false);
  make(groups.glow, matGlow, false);
  chunk.dirty = false;
}

export function updateChunks(playerPos: { x: number; z: number }): void {
  const pcx = Math.floor(playerPos.x / CHUNK);
  const pcz = Math.floor(playerPos.z / CHUNK);
  const need: { c: Chunk; d: number }[] = [];
  for (let dx = -RENDER_DIST; dx <= RENDER_DIST; dx++) for (let dz = -RENDER_DIST; dz <= RENDER_DIST; dz++) {
    if (dx * dx + dz * dz > RENDER_DIST * RENDER_DIST + 2) continue;
    const c = world.getChunk(pcx + dx, pcz + dz);
    if (c.dirty) need.push({ c, d: dx * dx + dz * dz });
  }
  need.sort((a, b) => a.d - b.d);
  let built = 0;
  for (const { c } of need) {
    buildChunkMesh(c);
    if (++built >= 2) break;
  }
  for (const c of world.chunks.values()) {
    const dx = c.cx - pcx, dz = c.cz - pcz;
    const vis = dx * dx + dz * dz <= RENDER_DIST * RENDER_DIST + 2;
    for (const m of c.meshes as THREE.Mesh[]) m.visible = vis;
  }
}
