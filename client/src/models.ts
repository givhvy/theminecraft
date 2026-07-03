// Model 3D chi tiết cho dụng cụ/vũ khí/vật phẩm — dùng chung cho icon inventory + tay cầm
import * as THREE from 'three';
import { TOOLS, type ToolId, type ToolTier } from '@shared/blocks';

// ---- vật liệu theo tier ----
const woodMat = new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 0.82, metalness: 0 });
const woodDarkMat = new THREE.MeshStandardMaterial({ color: 0x5c3d22, roughness: 0.9, metalness: 0 });
const leatherMat = new THREE.MeshStandardMaterial({ color: 0x4e3018, roughness: 0.95, metalness: 0 });

const TIER_METAL: Record<ToolTier, THREE.MeshStandardMaterial> = {
  iron: new THREE.MeshStandardMaterial({ color: 0xdde3ea, metalness: 0.95, roughness: 0.22 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xffcd3f, metalness: 1.0, roughness: 0.16 }),
  diamond: new THREE.MeshStandardMaterial({
    color: 0x8ff0e6, metalness: 0.5, roughness: 0.05,
    emissive: 0x0e5f58, emissiveIntensity: 0.35,
  }),
};
const TIER_DARK: Record<ToolTier, THREE.MeshStandardMaterial> = {
  iron: new THREE.MeshStandardMaterial({ color: 0x9aa4b0, metalness: 0.9, roughness: 0.35 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xcf9d1e, metalness: 1.0, roughness: 0.3 }),
  diamond: new THREE.MeshStandardMaterial({
    color: 0x55c9bd, metalness: 0.5, roughness: 0.12, emissive: 0x0a4a44, emissiveIntensity: 0.3,
  }),
};

function extrude(shape: THREE.Shape, depth: number, bevel: number): THREE.ExtrudeGeometry {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, steps: 1,
  });
  g.translate(0, 0, -depth / 2 - bevel);
  return g;
}

// ---- chuôi gỗ tiện tròn + quấn da ----
function makeHandle(len: number, grip = true): THREE.Group {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.036, len, 12), woodMat);
  g.add(shaft);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 8), woodDarkMat);
  cap.position.y = -len / 2;
  g.add(cap);
  if (grip) {
    const wrap = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.038, len * 0.34, 12), leatherMat);
    wrap.position.y = -len * 0.22;
    g.add(wrap);
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.037, 0.006, 6, 14), woodDarkMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -len * 0.1 - i * len * 0.09;
      g.add(ring);
    }
  }
  return g;
}

// ---- Kiếm: lưỡi vát nhọn 2 cạnh + rãnh máu + chắn tay cong + núm chuôi ----
function makeSword(tier: ToolTier): THREE.Group {
  const g = new THREE.Group();
  const metal = TIER_METAL[tier], dark = TIER_DARK[tier];

  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(-0.048, 0);
  bladeShape.lineTo(-0.052, 0.42);
  bladeShape.quadraticCurveTo(-0.045, 0.52, 0, 0.62);   // mũi nhọn
  bladeShape.quadraticCurveTo(0.045, 0.52, 0.052, 0.42);
  bladeShape.lineTo(0.048, 0);
  bladeShape.closePath();
  const blade = new THREE.Mesh(extrude(bladeShape, 0.012, 0.018), metal);
  blade.position.y = 0.13;
  g.add(blade);

  // rãnh máu (fuller) chạy giữa lưỡi
  const fuller = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.38, 0.052), dark);
  fuller.position.y = 0.3;
  g.add(fuller);

  // chắn tay: thanh cong + 2 đầu tròn
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.035, 0.06), dark);
  guard.position.y = 0.115;
  g.add(guard);
  for (const s of [-1, 1]) {
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), metal);
    tip.position.set(s * 0.125, 0.115, 0);
    g.add(tip);
  }

  // chuôi quấn da + núm
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.2, 12), leatherMat);
  grip.position.y = -0.0;
  g.add(grip);
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.006, 6, 14), dark);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.06 - i * 0.055;
    g.add(ring);
  }
  const pommel = new THREE.Mesh(
    tier === 'diamond' ? new THREE.OctahedronGeometry(0.05) : new THREE.SphereGeometry(0.045, 12, 10),
    metal,
  );
  pommel.position.y = -0.13;
  g.add(pommel);
  return g;
}

// ---- Cúp: đầu lưỡi liềm cong 2 mũi nhọn + đai kim loại ----
function makePickaxe(tier: ToolTier): THREE.Group {
  const g = new THREE.Group();
  const metal = TIER_METAL[tier];

  g.add(makeHandle(0.72));

  const headShape = new THREE.Shape();
  const a0 = -0.12, a1 = Math.PI + 0.12;
  headShape.absarc(0, 0, 0.32, a0, a1, false);            // vòng ngoài qua đỉnh
  headShape.absarc(0, 0.12, 0.21, a1, a0, true);          // vòng trong lệch tâm → 2 mũi nhọn dần
  headShape.closePath();
  const head = new THREE.Mesh(extrude(headShape, 0.045, 0.012), metal);
  head.position.y = 0.3;
  g.add(head);

  // đai buộc đầu cúp vào cán
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.07, 10), TIER_DARK[tier]);
  collar.position.y = 0.32;
  g.add(collar);
  return g;
}

// ---- Rìu: lưỡi loe cạnh bén + gáy búa ----
function makeAxe(tier: ToolTier): THREE.Group {
  const g = new THREE.Group();
  const metal = TIER_METAL[tier];

  g.add(makeHandle(0.72));

  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0.0, 0.055);
  bladeShape.lineTo(0.13, 0.1);
  bladeShape.quadraticCurveTo(0.24, 0.14, 0.3, 0.06);     // mép trên loe ra
  bladeShape.quadraticCurveTo(0.33, -0.04, 0.27, -0.13);  // cạnh bén cong
  bladeShape.quadraticCurveTo(0.18, -0.1, 0.12, -0.07);   // hàm rìu (beard)
  bladeShape.lineTo(0.0, -0.05);
  bladeShape.closePath();
  const blade = new THREE.Mesh(extrude(bladeShape, 0.04, 0.012), metal);
  blade.position.set(0.01, 0.28, 0);
  g.add(blade);

  // gáy búa phía sau
  const poll = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.07), TIER_DARK[tier]);
  poll.position.set(-0.05, 0.28, 0);
  g.add(poll);
  return g;
}

// ---- Xẻng: lưỡi lòng máng mũi nhọn + cổ nối ----
function makeShovel(tier: ToolTier): THREE.Group {
  const g = new THREE.Group();
  const metal = TIER_METAL[tier];

  g.add(makeHandle(0.68));

  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(-0.085, 0);
  bladeShape.lineTo(-0.085, 0.13);
  bladeShape.quadraticCurveTo(-0.08, 0.2, 0, 0.25);       // mũi xẻng bo tròn
  bladeShape.quadraticCurveTo(0.08, 0.2, 0.085, 0.13);
  bladeShape.lineTo(0.085, 0);
  bladeShape.quadraticCurveTo(0, -0.03, -0.085, 0);
  bladeShape.closePath();
  const blade = new THREE.Mesh(extrude(bladeShape, 0.018, 0.012), metal);
  blade.position.y = 0.3;
  // hơi cong lòng máng
  blade.rotation.x = 0.12;
  g.add(blade);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.034, 0.1, 10), TIER_DARK[tier]);
  neck.position.y = 0.28;
  g.add(neck);
  return g;
}

export function makeToolModel(toolId: ToolId): THREE.Group {
  const tier = TOOLS[toolId].tier;
  let g: THREE.Group;
  if (toolId.includes('sword')) g = makeSword(tier);
  else if (toolId.includes('pickaxe')) g = makePickaxe(tier);
  else if (toolId === 'axe') g = makeAxe(tier);
  else g = makeShovel(tier);
  return g;
}

// ---- Lửa mồi: quẹt thép chữ C + đá lửa + ngọn lửa 2 lớp ----
export function makeIgniterModel(): THREE.Group {
  const g = new THREE.Group();
  const steel = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.022, 8, 18, Math.PI * 1.35), TIER_METAL.iron);
  steel.rotation.z = Math.PI * 0.82;
  steel.position.set(0.05, -0.05, 0);
  g.add(steel);

  const flint = new THREE.Mesh(new THREE.DodecahedronGeometry(0.06), new THREE.MeshStandardMaterial({ color: 0x3c3c46, roughness: 0.6, metalness: 0.2 }));
  flint.position.set(-0.08, -0.02, 0);
  g.add(flint);

  const flameOuter = new THREE.Mesh(
    new THREE.ConeGeometry(0.075, 0.22, 10),
    new THREE.MeshBasicMaterial({ color: 0xff7722, transparent: true, opacity: 0.85 }),
  );
  flameOuter.position.set(-0.08, 0.12, 0);
  const flameInner = new THREE.Mesh(
    new THREE.ConeGeometry(0.04, 0.13, 8),
    new THREE.MeshBasicMaterial({ color: 0xffe066 }),
  );
  flameInner.position.set(-0.08, 0.1, 0);
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0.35 }),
  );
  glow.position.set(-0.08, 0.12, 0);
  g.add(flameOuter, flameInner, glow);
  return g;
}

// ---- Trứng spawn: quả trứng màu theo con vật + đốm ----
const EGG_COLORS: Record<string, [number, number]> = {
  horse:   [0x8a5a32, 0x4a2f18],
  pig:     [0xeda3a3, 0xd05f5f],
  cow:     [0x6b4a33, 0xe8e0d2],
  chicken: [0xf2eee6, 0xe8b23a],
  sheep:   [0xf4f1ea, 0xb09a8a],
  zombie:  [0x4e9b3c, 0x2a5e20],
  creeper: [0x54c354, 0x111111],
};
export function makeEggModel(animal: string): THREE.Group {
  const [base, spot] = EGG_COLORS[animal] || EGG_COLORS.chicken;
  const g = new THREE.Group();
  const egg = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 18, 14),
    new THREE.MeshStandardMaterial({ color: base, roughness: 0.55, metalness: 0 }),
  );
  egg.scale.set(0.82, 1.12, 0.82);
  g.add(egg);
  // đốm màu đặc trưng
  const spotMat = new THREE.MeshStandardMaterial({ color: spot, roughness: 0.6 });
  const rnd = (i: number) => Math.sin(i * 127.1) * 0.5 + 0.5;
  for (let i = 0; i < 7; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.045 + rnd(i) * 0.03, 8, 6), spotMat);
    const th = rnd(i * 3 + 1) * Math.PI * 2, ph = 0.4 + rnd(i * 7 + 2) * 2.2;
    s.position.set(Math.sin(ph) * Math.cos(th) * 0.25, Math.cos(ph) * 0.33, Math.sin(ph) * Math.sin(th) * 0.25);
    g.add(s);
  }
  return g;
}

// ---- Thuyền: thân thuôn mũi vểnh + băng ghế + mái chèo ----
export function makeBoatModel(): THREE.Group {
  const g = new THREE.Group();
  const hullProfile = new THREE.Shape();
  hullProfile.moveTo(-0.48, 0.16);
  hullProfile.quadraticCurveTo(-0.42, 0.0, -0.28, -0.02); // mũi vểnh
  hullProfile.lineTo(0.3, -0.02);
  hullProfile.quadraticCurveTo(0.44, 0.0, 0.46, 0.15);    // đuôi vểnh nhẹ
  hullProfile.lineTo(0.42, 0.17);
  hullProfile.lineTo(0.4, 0.06);
  hullProfile.quadraticCurveTo(0.3, 0.04, -0.26, 0.04);   // lòng thuyền rỗng
  hullProfile.quadraticCurveTo(-0.38, 0.06, -0.43, 0.17);
  hullProfile.closePath();
  const hull = new THREE.Mesh(extrude(hullProfile, 0.4, 0.02), woodMat);
  g.add(hull);

  const keel = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.035, 0.42), woodDarkMat);
  keel.position.y = -0.03;
  g.add(keel);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.36), woodDarkMat);
  seat.position.set(0.05, 0.08, 0);
  g.add(seat);

  const oar = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.5, 8), woodDarkMat);
  const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.02), woodMat);
  paddle.position.y = -0.28;
  oar.add(pole, paddle);
  oar.position.set(0.0, 0.18, 0.24);
  oar.rotation.z = -0.5;
  oar.rotation.x = 0.25;
  g.add(oar);
  return g;
}
