import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165/build/three.module.js';

/* ============================================================
   UE長崎 — Three.js 群島シーン
   ============================================================ */

// ─── Constants ──────────────────────────────────────────────────────────────

const COLOR = {
  bg:      0x08111f,
  sky:     0x0b1220,
  sea:     0x101826,
  blue:    0x7cc7ff,
  warm:    0xffd27a,
  star:    0xd0e8ff,
  stone:   0x2a3a4e,
  wood:    0x5c4a30,
  plaster: 0xd6c6a7,
  roof:    0x3a3028,
  dark:    0x1a2a3a,
  pier:    0x3a2e1c,
  antenna: 0xaabbcc,
  sail:    0xd0c8b0,
  crate:   0x1e3040,
};

const ISLAND_COUNT  = 4;
const ISLAND_RADIUS = 16;
const ISLAND_STEP   = (Math.PI * 2) / ISLAND_COUNT;

const AUTOPLAY_IDLE_MS = 6000;
const WHEEL_COOLDOWN_MS = 300;
const SWIPE_THRESHOLD_PX = 50;
const TRANSITION_MS = 500;

const STAR_COUNT    = 1600;
const STAR_RADIUS   = 300;
const STAR_SPREAD   = 80;
const SEA_SEGMENTS  = 80;
const SEA_Y         = -1.2;

const LERP_SPEED        = 0.05;
const SELF_ROTATE_SPEED = 0.0015;
const STAR_DRIFT_SPEED  = 0.0003;

// ─── Scene / camera / renderer ──────────────────────────────────────────────

const canvas = document.getElementById('bg');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(COLOR.bg, 0.025);
scene.background = new THREE.Color(COLOR.bg);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 15, 40);
camera.lookAt(0, 5, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ─── Lighting ───────────────────────────────────────────────────────────────

scene.add(new THREE.AmbientLight(0x7090c0, 0.6));

const moonLight = new THREE.DirectionalLight(COLOR.blue, 0.4);
moonLight.position.set(-20, 30, 10);
scene.add(moonLight);

// ─── Sky ────────────────────────────────────────────────────────────────────

scene.add(new THREE.Mesh(
  new THREE.SphereGeometry(400, 16, 8),
  new THREE.MeshBasicMaterial({ color: COLOR.sky, side: THREE.BackSide }),
));

// ─── Stars ──────────────────────────────────────────────────────────────────

const starPositions = new Float32Array(STAR_COUNT * 3);
for (let i = 0; i < STAR_COUNT; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi   = Math.acos(2 * Math.random() - 1);
  const r     = STAR_RADIUS + Math.random() * STAR_SPREAD;
  starPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
  starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
  starPositions[i * 3 + 2] = r * Math.cos(phi);
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starField = new THREE.Points(
  starGeo,
  new THREE.PointsMaterial({ color: COLOR.star, size: 1.5, sizeAttenuation: false, fog: false }),
);
scene.add(starField);

// ─── Sea ────────────────────────────────────────────────────────────────────

const seaGeo = new THREE.PlaneGeometry(400, 400, SEA_SEGMENTS, SEA_SEGMENTS);
seaGeo.rotateX(-Math.PI / 2);
const seaBaseY = seaGeo.attributes.position.array.slice();

const seaMesh = new THREE.Mesh(seaGeo, new THREE.MeshStandardMaterial({
  color: COLOR.sea, roughness: 0.85, metalness: 0.15,
  transparent: true, opacity: 0.92,
}));
seaMesh.position.y = SEA_Y;
seaMesh.receiveShadow = true;
scene.add(seaMesh);

function updateSea(t) {
  const pos = seaGeo.attributes.position;
  for (let i = 0, n = pos.count; i < n; i++) {
    const bx = seaBaseY[i * 3];
    const bz = seaBaseY[i * 3 + 2];
    pos.setY(i, Math.sin(bx * 0.06 + t) * 0.18 + Math.sin(bz * 0.05 + t * 0.7) * 0.14);
  }
  pos.needsUpdate = true;
  seaGeo.computeVertexNormals();
}

// ─── Shared materials & helpers ─────────────────────────────────────────────

const MAT = {
  stone:   new THREE.MeshStandardMaterial({ color: COLOR.stone,   roughness: 0.9 }),
  wood:    new THREE.MeshStandardMaterial({ color: COLOR.wood,    roughness: 0.9 }),
  plaster: new THREE.MeshStandardMaterial({ color: COLOR.plaster, roughness: 0.85 }),
  roof:    new THREE.MeshStandardMaterial({ color: COLOR.roof,    roughness: 0.9 }),
  warm:    new THREE.MeshBasicMaterial({ color: COLOR.warm }),
  blue:    new THREE.MeshBasicMaterial({ color: COLOR.blue }),
  dark:    new THREE.MeshStandardMaterial({ color: COLOR.dark, roughness: 0.95 }),
  pier:    new THREE.MeshStandardMaterial({ color: COLOR.pier, roughness: 0.95 }),
};

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

function cyl(rt, rb, h, segs, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

function cone(r, h, segs, mat, x = 0, y = 0, z = 0, ry = 0) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, segs), mat);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  m.castShadow = true;
  return m;
}

function addPier(g, z, spans = 3) {
  const hw = (spans - 1) * 0.5;
  for (let i = 0; i < spans; i++) {
    g.add(box(0.3, 0.14, 0.8, MAT.pier, -hw + i, 0.8, z));
  }
  g.add(box(0.12, 1.6, 0.12, MAT.pier, -hw,  -0.1, z));
  g.add(box(0.12, 1.6, 0.12, MAT.pier,  hw,  -0.1, z));
}

// ─── Island: Top (出島 + 港) ───────────────────────────────────────────────

function createTopIsland() {
  const g = new THREE.Group();

  g.add(new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.8, 1.6, 7), MAT.stone));

  // 灯台
  g.add(cyl(0.35, 0.65, 5, 8, MAT.plaster, 0.8, 3.4));
  g.add(cone(0.7, 1.0, 8, MAT.roof, 0.8, 6.3));
  const lighthouseLight = new THREE.PointLight(COLOR.warm, 3, 18);
  lighthouseLight.position.set(0.8, 6.2, 0);
  g.add(lighthouseLight);

  // 桟橋
  for (let i = 0; i < 4; i++) {
    g.add(box(0.3, 0.18, 0.9, MAT.pier, -1.8 + i * 0.6, 0.9, 4.5));
  }
  g.add(box(0.12, 2.2, 0.12, MAT.pier, -1.2, -0.4, 4.5));
  g.add(box(0.12, 2.2, 0.12, MAT.pier,  0,   -0.4, 4.5));
  g.add(box(0.12, 2.2, 0.12, MAT.pier,  1.2, -0.4, 4.5));
  g.add(box(2.8, 0.12, 0.12, MAT.pier,  0,    0.8, 4.5));

  // 船影
  const boat = new THREE.Group();
  boat.add(box(2.4, 0.4, 0.9, MAT.dark));
  boat.add(box(0.12, 1.4, 0.12, MAT.plaster, 0.5, 0.9, 0));
  const sail = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 1.0),
    new THREE.MeshBasicMaterial({ color: COLOR.sail, side: THREE.DoubleSide }),
  );
  sail.position.set(0.5, 1.4, 0.07);
  boat.add(sail);
  boat.position.set(3.8, -0.5, 2.0);
  boat.rotation.y = 0.5;
  g.add(boat);

  return g;
}

// ─── Island: About (坂の街 + 工房) ─────────────────────────────────────────

function createAboutIsland() {
  const g = new THREE.Group();

  // 階段状台地
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(4.0, 5.0, 1.4, 6), MAT.stone));
  g.add(box(5.0, 0.6, 3.5, MAT.stone, 0,   1.0, 0));
  g.add(box(3.5, 0.6, 2.5, MAT.stone, 0,   1.6, 0.5));
  g.add(box(2.0, 0.6, 1.5, MAT.stone, 0.2, 2.2, 0.8));

  // 階段
  for (let i = 0; i < 4; i++) {
    g.add(box(1.0, 0.25, 0.5, MAT.stone, -0.8, 0.8 + i * 0.6, -1.2 + i * 0.5));
  }

  // 工房
  g.add(box(2.2, 1.8, 1.6, MAT.plaster, -0.6, 2.7, 0.2));
  g.add(cone(1.4, 1.0, 4, MAT.roof, -0.6, 4.1, 0.2, Math.PI / 4));
  const workshopWin = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5), MAT.warm);
  workshopWin.position.set(-0.6, 2.7, 1.01);
  g.add(workshopWin);

  // 小さな家1
  g.add(box(1.2, 1.2, 1.0, MAT.plaster, 1.4, 2.4, 0.5));
  g.add(cone(0.8, 0.8, 4, MAT.roof, 1.4, 3.4, 0.5, Math.PI / 4));
  const house1Win = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.3), MAT.warm);
  house1Win.position.set(1.4, 2.4, 1.01);
  g.add(house1Win);

  // 小さな家2
  g.add(box(1.0, 1.0, 0.9, MAT.plaster, -1.8, 2.2, -0.2));
  g.add(cone(0.7, 0.7, 4, MAT.roof, -1.8, 3.05, -0.2, Math.PI / 4));

  // 煙突
  g.add(cyl(0.1, 0.15, 1.0, 6, MAT.stone, -0.2, 4.8, 0.0));

  const warmLight = new THREE.PointLight(COLOR.warm, 1.5, 12);
  warmLight.position.set(0, 4, 0);
  g.add(warmLight);

  return g;
}

// ─── Island: Event (港イベント / 祭り) ──────────────────────────────────────

function createEventIsland() {
  const g = new THREE.Group();

  g.add(new THREE.Mesh(new THREE.CylinderGeometry(4.2, 5.0, 1.2, 7), MAT.stone));

  // ステージ
  g.add(box(3.6, 0.3, 2.2, MAT.wood, 0, 0.75, 0.2));

  // コンテナ
  g.add(box(1.4, 1.0, 0.9, MAT.dark, -1.8, 1.1, -1.2));
  g.add(box(1.2, 1.0, 0.9, new THREE.MeshStandardMaterial({ color: COLOR.crate, roughness: 0.9 }), -0.2, 1.1, -1.5));

  // 旗ポール
  g.add(cyl(0.06, 0.06, 3.0, 6, MAT.plaster, -1.2, 2.1, 0.8));
  g.add(cyl(0.06, 0.06, 2.5, 6, MAT.plaster,  1.2, 1.85, 0.8));

  // 旗（name 属性で animate から参照）
  const flagMat = new THREE.MeshBasicMaterial({ color: COLOR.blue, side: THREE.DoubleSide });
  const flag1 = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), flagMat);
  flag1.position.set(-0.85, 3.3, 0.8);
  flag1.name = 'flag';
  g.add(flag1);
  const flag2 = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.38), flagMat);
  flag2.position.set(0.85, 3.25, 0.8);
  flag2.name = 'flag';
  g.add(flag2);

  // 屋台
  g.add(box(1.0, 0.8, 0.7, MAT.wood, 2.0, 1.0, 0.5));
  g.add(box(1.2, 0.06, 0.9, MAT.roof, 2.0, 1.5, 0.5));

  // 投光
  const spot = new THREE.SpotLight(0xfff0cc, 4, 20, Math.PI / 6, 0.5);
  spot.position.set(0, 8, 0);
  spot.target.position.set(0, 0, 0);
  g.add(spot);
  g.add(spot.target);

  return g;
}

// ─── Island: Contact (通信塔) ───────────────────────────────────────────────

function createContactIsland() {
  const g = new THREE.Group();

  g.add(new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.6, 1.4, 6), MAT.stone));

  // 通信塔
  g.add(cyl(0.25, 0.4, 6.0, 8, MAT.plaster, 0, 3.8, 0));
  g.add(cyl(0.15, 0.25, 3.0, 8, MAT.plaster, 0, 8.3, 0));
  g.add(cyl(0.08, 0.15, 2.0, 8, MAT.plaster, 0, 10.8, 0));

  // アンテナ
  const antMat = new THREE.MeshStandardMaterial({ color: COLOR.antenna, roughness: 0.7 });
  g.add(box(2.2, 0.06, 0.06, antMat, 0, 9.5,  0));
  g.add(box(1.4, 0.06, 0.06, antMat, 0, 10.2, 0));
  g.add(box(0.8, 0.06, 0.06, antMat, 0, 10.8, 0));

  // 信号灯
  const signalLight = new THREE.PointLight(COLOR.blue, 3, 16);
  signalLight.position.set(0, 11.8, 0);
  signalLight.name = 'signalLight';
  g.add(signalLight);

  const signalBulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), MAT.blue);
  signalBulb.position.set(0, 11.8, 0);
  g.add(signalBulb);

  // 桟橋
  addPier(g, 3.8, 3);

  return g;
}

// ─── Islands group ──────────────────────────────────────────────────────────

const islandsGroup = new THREE.Group();
scene.add(islandsGroup);

[createTopIsland(), createAboutIsland(), createEventIsland(), createContactIsland()]
  .forEach((island, i) => {
    const angle = ISLAND_STEP * i;
    island.position.set(Math.sin(angle) * ISLAND_RADIUS, 0, Math.cos(angle) * ISLAND_RADIUS);
    islandsGroup.add(island);
  });

// ─── Center column ──────────────────────────────────────────────────────────

const centerGroup = new THREE.Group();
scene.add(centerGroup);

centerGroup.add(new THREE.Mesh(
  new THREE.CylinderGeometry(1.2, 1.6, 0.5, 8),
  new THREE.MeshStandardMaterial({ color: COLOR.dark, roughness: 0.8 }),
));

const pillarMat = new THREE.MeshBasicMaterial({ color: COLOR.blue, transparent: true, opacity: 0.35 });
const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 22, 16), pillarMat);
pillar.position.y = 11.25;
centerGroup.add(pillar);

const pillarTop = new THREE.Mesh(
  new THREE.CylinderGeometry(0.05, 0.12, 10, 16),
  new THREE.MeshBasicMaterial({ color: COLOR.blue, transparent: true, opacity: 0.12 }),
);
pillarTop.position.y = 27;
centerGroup.add(pillarTop);

const centerPointLight = new THREE.PointLight(COLOR.blue, 2.5, 30);
centerPointLight.position.y = 6;
centerGroup.add(centerPointLight);

// ─── Cached references for animate() ────────────────────────────────────────

const eventIsland   = islandsGroup.children[2];
const contactIsland = islandsGroup.children[3];
const signalLightRef = contactIsland.getObjectByName('signalLight');

// ─── Navigation state ───────────────────────────────────────────────────────

let currentIndex    = 0;
let currentAbsoluteIndex = 0;
let targetRotation  = 0;
let lastInteraction = Date.now();

const sections  = document.querySelectorAll('.content');
const navButtons = document.querySelectorAll('.bottom-nav button');

function setIsland(index, fromUser = true) {
  const newIndex = ((index % ISLAND_COUNT) + ISLAND_COUNT) % ISLAND_COUNT;
  if (newIndex === currentIndex) return;

  let diff = newIndex - currentIndex;
  if (diff < -ISLAND_COUNT / 2) diff += ISLAND_COUNT;
  if (diff > ISLAND_COUNT / 2) diff -= ISLAND_COUNT;
  currentAbsoluteIndex += diff;

  const dir = diff > 0 ? 'left' : 'right';
  const leaveClass = dir === 'left' ? 'leave-left' : 'leave-right';

  sections.forEach(s => {
    if (s.classList.contains('active')) {
      s.classList.remove('active');
      s.classList.add(leaveClass);
      setTimeout(() => s.classList.remove('leave-left', 'leave-right'), TRANSITION_MS);
    }
  });

  currentIndex = newIndex;
  targetRotation = -ISLAND_STEP * currentAbsoluteIndex;

  navButtons.forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-island="${currentIndex}"]`).classList.add('active');
  document.querySelector(`[data-target="${currentIndex}"]`).classList.add('active');

  if (fromUser) lastInteraction = Date.now();
}

// ─── Input handlers ─────────────────────────────────────────────────────────

navButtons.forEach(btn => {
  btn.addEventListener('click', () => setIsland(Number(btn.dataset.target)));
});

// Wheel with cooldown
let lastWheelTime = 0;
window.addEventListener('wheel', (e) => {
  const now = Date.now();
  if (now - lastWheelTime < WHEEL_COOLDOWN_MS) return;
  lastWheelTime = now;
  setIsland(currentIndex + (e.deltaY > 0 ? 1 : -1));
}, { passive: true });

// Keyboard
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') setIsland(currentIndex + 1);
  if (e.key === 'ArrowLeft')  setIsland(currentIndex - 1);
});

// Touch / swipe
let touchStartX = 0;
window.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });

window.addEventListener('touchend', (e) => {
  const diff = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > SWIPE_THRESHOLD_PX) {
    setIsland(currentIndex + (diff > 0 ? 1 : -1));
  }
}, { passive: true });

// Raycaster (island click)
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

canvas.addEventListener('click', (e) => {
  pointer.x =  (e.clientX / innerWidth)  * 2 - 1;
  pointer.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(islandsGroup.children, true);
  if (hits.length === 0) return;

  let parent = hits[0].object;
  while (parent.parent !== islandsGroup) parent = parent.parent;
  const idx = islandsGroup.children.indexOf(parent);
  if (idx !== -1) setIsland(idx);
});

// Resize
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ─── Loading ────────────────────────────────────────────────────────────────

const loadingEl = document.getElementById('loading');
window.addEventListener('load', () => {
  setTimeout(() => loadingEl?.classList.add('hidden'), 400);
});

// ─── NEXT EVENT dynamic load ────────────────────────────────────────────────

fetch('events.json')
  .then(r => r.json())
  .then(data => {
    const ev = data.next_event;
    if (!ev) return;
    const titleEl = document.getElementById('event-title');
    const dateEl  = document.getElementById('event-date');
    const linkEl  = document.getElementById('event-link');
    if (titleEl) titleEl.textContent = ev.title;
    if (dateEl)  dateEl.textContent  = ev.date.replace(/-/g, '.');
    if (linkEl && ev.connpass) linkEl.href = ev.connpass;
  })
  .catch(() => {});

// ─── Animate ────────────────────────────────────────────────────────────────

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  updateSea(t * 0.5);

  starField.rotation.y = t * STAR_DRIFT_SPEED;

  islandsGroup.rotation.y += (targetRotation - islandsGroup.rotation.y) * LERP_SPEED;

  islandsGroup.children.forEach(island => { island.rotation.y += SELF_ROTATE_SPEED; });

  // 旗の揺れ (Event島)
  eventIsland.children.forEach(child => {
    if (child.name === 'flag') child.rotation.y = Math.sin(t * 1.8) * 0.2;
  });

  // 信号灯点滅 (Contact島)
  if (signalLightRef) {
    signalLightRef.intensity = Math.sin(t * 2.5) > 0.3 ? 4 : 0.2;
  }

  // 光柱パルス
  pillarMat.opacity = 0.28 + Math.sin(t * 0.8) * 0.08;

  // オートプレイ
  if (Date.now() - lastInteraction > AUTOPLAY_IDLE_MS) {
    setIsland(currentIndex + 1, false);
    lastInteraction = Date.now();
  }

  renderer.render(scene, camera);
}

animate();
