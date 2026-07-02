// Dựng mesh chunk: face culling + ambient occlusion, 3 lớp vật liệu
// Sinh chunk + dựng mesh theo ngân sách thời gian mỗi frame để không giật khi di chuyển
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

interface GeoBuf { positions: number[]; uvs: number[]; colors: number[]; normals: number[]; indices: number[] }

export function buildChunkMesh(chunk: Chunk): void {
  const groups: Record<'solid' | 'water' | 'glow', GeoBuf> = {
    solid: { positions: [], uvs: [], colors: [], normals: [], indices: [] },
    water: { positions: [], uvs: [], colors: [], normals: [], indices: [] },
    glow:  { positions: [], uvs: [], colors: [], normals: [], indices: [] },
  };
  const baseX = chunk.cx * CHUNK, baseZ = chunk.cz * CHUNK;

  // cache 3×3 chunk lân cận: tra block bằng số học thuần, không Map lookup mỗi block
  const nbr: Uint8Array[] = [];
  for (let dcx = -1; dcx <= 1; dcx++) for (let dcz = -1; dcz <= 1; dcz++) {
    nbr.push(world.getChunk(chunk.cx + dcx, chunk.cz + dcz).data);
  }
  const getB = (wx: number, y: number, wz: number): number => {
    if (y < 0 || y >= HEIGHT) return AIR;
    const lx = wx - baseX + CHUNK, lz = wz - baseZ + CHUNK; // 0..47
    const ci = (lx / CHUNK) | 0, cj = (lz / CHUNK) | 0;
    return nbr[ci * 3 + cj][(y * CHUNK + (lz - cj * CHUNK)) * CHUNK + (lx - ci * CHUNK)];
  };

  const vertexAO = (bx: number, by: number, bz: number, face: Face, corner: [number, number, number]): number => {
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
      const b = getB(p[0], p[1], p[2]);
      const def = B[b];
      return (b !== AIR && def && !def.transparent && !def.liquid) ? 1 : 0;
    };
    const s1 = occ(p1), s2 = occ(p2);
    if (s1 && s2) return 0;
    return 3 - (s1 + s2 + occ(p3));
  };

  for (let y = 0; y < HEIGHT; y++) for (let z = 0; z < CHUNK; z++) for (let x = 0; x < CHUNK; x++) {
    const b = chunk.data[(y * CHUNK + z) * CHUNK + x];
    if (b === AIR) continue;
    const def = B[b];
      const target = def.liquid || def.portal ? groups.water : (def.emissive ? groups.glow : groups.solid);
    for (const face of FACES) {
      const nb = getB(baseX + x + face.dir[0], y + face.dir[1], baseZ + z + face.dir[2]);
      const nbDef = B[nb];
      const visible = nb === AIR || (nbDef && (nbDef.transparent || nbDef.liquid || nbDef.portal) && nb !== b);
      if (!visible) continue;
      const tileIdx = def.tiles[face.tile];
      const vi = target.positions.length / 3;
      for (let i = 0; i < 4; i++) {
        const c = face.corners[i];
        target.positions.push(baseX + x + c[0], y + c[1], baseZ + z + c[2]);
        target.uvs.push((tileIdx + FACE_UVS[i][0]) / NTILES, FACE_UVS[i][1]);
        target.normals.push(face.dir[0], face.dir[1], face.dir[2]);
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
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.normals, 3));
    geo.setIndex(g.indices);
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

// Ngân sách thời gian mỗi frame (ms): sinh chunk mới + dựng mesh rải đều qua nhiều frame
const GEN_BUDGET = 4;
const MESH_BUDGET = 7;

export function updateChunks(playerPos: { x: number; z: number }): void {
  const t0 = performance.now();
  const pcx = Math.floor(playerPos.x / CHUNK);
  const pcz = Math.floor(playerPos.z / CHUNK);

  const missing: { cx: number; cz: number; d: number }[] = [];
  const dirty: { c: Chunk; d: number }[] = [];
  for (let dx = -RENDER_DIST; dx <= RENDER_DIST; dx++) for (let dz = -RENDER_DIST; dz <= RENDER_DIST; dz++) {
    const d = dx * dx + dz * dz;
    if (d > RENDER_DIST * RENDER_DIST + 2) continue;
    const c = world.peekChunk(pcx + dx, pcz + dz);
    if (!c) missing.push({ cx: pcx + dx, cz: pcz + dz, d });
    else if (c.dirty) dirty.push({ c, d });
  }
  missing.sort((a, b) => a.d - b.d);
  dirty.sort((a, b) => a.d - b.d);

  // sinh chunk mới gần nhất trong ngân sách (chunk ngay dưới chân luôn được sinh)
  for (const m of missing) {
    if (m.d > 2 && performance.now() - t0 > GEN_BUDGET) break;
    world.getChunk(m.cx, m.cz);
  }

  // dựng mesh chunk dirty gần nhất; cần đủ 3×3 lân cận đã sinh (cho AO/culling biên)
  let meshed = 0;
  for (const { c } of dirty) {
    if (meshed > 0 && performance.now() - t0 > MESH_BUDGET) break;
    let ready = true;
    for (let dcx = -1; dcx <= 1 && ready; dcx++) for (let dcz = -1; dcz <= 1; dcz++) {
      if (world.peekChunk(c.cx + dcx, c.cz + dcz)) continue;
      if (performance.now() - t0 < GEN_BUDGET + 2) { world.getChunk(c.cx + dcx, c.cz + dcz); }
      else { ready = false; break; }
    }
    if (!ready) break; // hết ngân sách sinh lân cận — frame sau tiếp tục
    buildChunkMesh(c);
    if (++meshed >= 3) break;
  }

  for (const c of world.chunks.values()) {
    const dx = c.cx - pcx, dz = c.cz - pcz;
    const vis = dx * dx + dz * dz <= RENDER_DIST * RENDER_DIST + 2;
    for (const m of c.meshes as THREE.Mesh[]) m.visible = vis;
  }
}
