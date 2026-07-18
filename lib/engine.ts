/* Aurelia Coachworks — assembly-line engine.
   Framework-agnostic Three.js module: no React imports, no DOM lookups
   outside the container it is given. The UI talks to it through hooks. */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface Stage {
  t: string;      // title
  n: string;      // note
  c: string;      // craft note
  cam: [number[], number[]];
  group: GroupKey | null;
}
type GroupKey = 'chassis' | 'engine' | 'rolling' | 'body' | 'doors' | 'bright' | 'cabin';

export const STAGES: Stage[] = [
  { t: 'The Spaceframe', group: 'chassis',
    n: 'Hand-welded aluminium rails and cross-members — the silent skeleton every grand tourer is built upon.',
    c: 'Each frame is checked for true within a third of a millimetre before it may leave Bay Nº 1.',
    cam: [[11, 5.2, 12], [0, 0.8, 0]] },
  { t: 'The V12 Heart', group: 'engine',
    n: 'A 6.8-litre V12, assembled by a single engineer and run for one hour before it earns its gold cam cover.',
    c: 'The builder signs the block by hand. No two signatures on the line are alike.',
    cam: [[8.4, 4.6, 8.2], [2.2, 1.2, 0]] },
  { t: 'Rolling Chassis', group: 'rolling',
    n: 'Forged wheels, eight-spoke hubs and self-levelling suspension — the car stands on its own feet for the first time.',
    c: 'Wheel caps are weighted so the monogram always comes to rest upright.',
    cam: [[10, 3.6, 11.5], [0.2, 1, 0]] },
  { t: 'The Marriage', group: 'body',
    n: 'The painted shell — five coats of midnight lacquer — is lowered onto the rolling chassis. The line falls quiet.',
    c: 'Body and chassis meet exactly once. The fit is measured in breaths, not millimetres.',
    cam: [[13, 6.5, 13], [0, 1.6, 0]] },
  { t: 'Coach Doors', group: 'doors',
    n: 'Rear-hinged coach doors, balanced to close from a fingertip. Aperture and swing are checked by ear.',
    c: 'A properly hung coach door closes with a note, not a noise.',
    cam: [[7.5, 3.8, 12], [-1, 1.6, 0]] },
  { t: 'Brightwork', group: 'bright',
    n: 'The pantheon grille, winged mascot and a single hand-painted coachline laid in one unbroken pull of the brush.',
    c: 'One artisan, one squirrel-hair brush, seven metres of gold line — no tape, no second attempts.',
    cam: [[14, 3.4, 5], [3.4, 1.5, 0]] },
  { t: 'The Bespoke Cabin', group: 'cabin',
    n: 'Cognac hides, open-pore walnut, and a starlight headliner of ninety hand-set fibres above the rear lounge.',
    c: 'Commission Nº 001 carries the constellation of the night the marque was founded.',
    cam: [[6.8, 5, 9.6], [-0.6, 2.2, 0]] },
  { t: 'Final Sign-Off', group: null,
    n: 'Six stringent checks under the concourse lamps. Certify each seal, and the motor car may leave the line.',
    c: 'Nothing leaves the atelier until the inspector stamps all six seals in oxblood ink.',
    cam: [[12.5, 5.4, 12.5], [0, 1.5, 0]] },
];

export const SEALS = [
  { p: [4.6, 1.5, 0], label: 'Grille & Mascot' },
  { p: [2.9, 2.2, 1.5], label: 'Paint Depth' },
  { p: [-1.5, 1.9, 1.6], label: 'Coach Door Swing' },
  { p: [2.9, 1.0, 1.9], label: 'Wheel & Hub' },
  { p: [-4.5, 1.7, 0], label: 'Rear Lamps' },
  { p: [-0.6, 3.3, 0], label: 'Starlight Cabin' },
];

export interface GameHooks {
  onStage(i: number): void;                       // stage i became current
  onStageDone(i: number): void;                   // stage i finished installing
  onToast(title: string): void;
  onStamp(text: string, sub: string, hold: number): void;
  onQCSpawn(): void;
  onQCCheck(sealIndex: number, totalDone: number): void;
  onReleased(): void;
}

export interface GameApi {
  advance(): void;
  runLine(speed?: number): void;
  startDemo(): void;
  dispose(): void;
}

export function createGame(container: HTMLElement, hooks: GameHooks): GameApi {
  /* ── renderer / scene ─────────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf6f1e7);
  scene.fog = new THREE.Fog(0xf6f1e7, 34, 70);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  (scene as THREE.Scene & { environmentIntensity: number }).environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 200);
  camera.position.set(15.5, 7.4, 15.5);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI / 2 - 0.04;
  controls.minDistance = 6; controls.maxDistance = 34;
  controls.target.set(0, 1.4, 0);

  /* lights — warm atelier */
  scene.add(new THREE.HemisphereLight(0xfff6e6, 0xcbbfa4, 1.05));
  const key = new THREE.DirectionalLight(0xfff2dc, 2.1);
  key.position.set(9, 15, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -11; key.shadow.camera.right = 11;
  key.shadow.camera.top = 11; key.shadow.camera.bottom = -11;
  key.shadow.bias = -0.0004;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xdfe8ff, 0.55);
  rim.position.set(-10, 8, -9);
  scene.add(rim);

  /* floor + turntable */
  const floor = new THREE.Mesh(new THREE.CircleGeometry(60, 64),
    new THREE.MeshStandardMaterial({ color: 0xf2ecdf, roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  scene.add(floor);

  const world = new THREE.Group(); scene.add(world);
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(7, 7.25, 0.28, 72),
    new THREE.MeshStandardMaterial({ color: 0xede4d1, roughness: 0.85 }));
  platform.position.y = 0.14; platform.receiveShadow = true; platform.castShadow = true;
  world.add(platform);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(7.02, 0.035, 10, 90),
    new THREE.MeshStandardMaterial({ color: 0xc9a961, metalness: 1, roughness: 0.3 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.285;
  world.add(ring);

  /* ── materials ────────────────────────────────────────── */
  const M = {
    paint: new THREE.MeshPhysicalMaterial({ color: 0x1d3054, metalness: 0.55, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xc9a961, metalness: 1, roughness: 0.24 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xdcdcda, metalness: 1, roughness: 0.16 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x9a9a98, metalness: 0.9, roughness: 0.45 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x23211e, roughness: 0.8 }),
    tire: new THREE.MeshStandardMaterial({ color: 0x181816, roughness: 0.95 }),
    leather: new THREE.MeshStandardMaterial({ color: 0x9c5a2c, roughness: 0.72 }),
    walnut: new THREE.MeshStandardMaterial({ color: 0x4a2e1a, roughness: 0.5, metalness: 0.1 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xaebfce, metalness: 0, roughness: 0.06, transparent: true, opacity: 0.34 }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xfff6de, emissive: 0xffedb8, emissiveIntensity: 0.9 }),
    tail: new THREE.MeshStandardMaterial({ color: 0x7e2020, emissive: 0x8e1f1f, emissiveIntensity: 0.7 }),
  };

  const box = (w: number, h: number, d: number, m: THREE.Material) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    o.castShadow = true; o.receiveShadow = true; return o;
  };
  const cyl = (rt: number, rb: number, h: number, m: THREE.Material, seg = 28) => {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
    o.castShadow = true; o.receiveShadow = true; return o;
  };
  const P = <T extends THREE.Object3D>(o: T, x: number, y: number, z: number): T => {
    o.position.set(x, y, z); return o;
  };

  /* ── the motor car — procedural grand tourer ─────────── */
  const car = new THREE.Group(); world.add(car);
  const G: Record<GroupKey, THREE.Group> = {
    chassis: new THREE.Group(), engine: new THREE.Group(), rolling: new THREE.Group(),
    body: new THREE.Group(), doors: new THREE.Group(), bright: new THREE.Group(), cabin: new THREE.Group(),
  };
  Object.values(G).forEach(g => { g.visible = false; car.add(g); });

  { // 01 · chassis
    const g = G.chassis;
    g.add(P(box(8.8, 0.2, 0.24, M.steel), 0, 0.62, 0.95));
    g.add(P(box(8.8, 0.2, 0.24, M.steel), 0, 0.62, -0.95));
    [-3.6, -1.6, 0.6, 2.6, 3.9].forEach(x => g.add(P(box(0.22, 0.16, 1.9, M.steel), x, 0.62, 0)));
    g.add(P(box(5.2, 0.07, 2.25, M.dark), -1.1, 0.74, 0));
  }
  { // 02 · V12 powertrain
    const g = G.engine;
    g.add(P(box(1.6, 0.95, 1.15, M.steel), 2.6, 1.15, 0));
    for (let i = 0; i < 6; i++) {
      g.add(P(cyl(0.09, 0.09, 0.3, M.chrome), 2.15 + i * 0.19, 1.72, 0.3));
      g.add(P(cyl(0.09, 0.09, 0.3, M.chrome), 2.15 + i * 0.19, 1.72, -0.3));
    }
    g.add(P(box(1.15, 0.14, 0.9, M.gold), 2.6, 1.68, 0));
    g.add(P(box(0.95, 0.62, 0.72, M.dark), 1.55, 1.0, 0));
    const shaft = cyl(0.08, 0.08, 3.4, M.steel); shaft.rotation.z = Math.PI / 2;
    g.add(P(shaft, -0.6, 0.86, 0));
    g.add(P(box(0.7, 0.5, 0.9, M.steel), -3.1, 0.9, 0));
  }
  { // 03 · rolling gear
    const g = G.rolling;
    const mkWheel = (x: number, z: number) => {
      const w = new THREE.Group();
      const t = cyl(0.97, 0.97, 0.6, M.tire, 36); t.rotation.x = Math.PI / 2; w.add(t);
      const h = cyl(0.58, 0.58, 0.63, M.chrome, 36); h.rotation.x = Math.PI / 2; w.add(h);
      for (let i = 0; i < 8; i++) {
        const sp = box(0.09, 0.42, 0.05, M.steel);
        sp.position.set(Math.sin(i / 8 * Math.PI * 2) * 0.3, Math.cos(i / 8 * Math.PI * 2) * 0.3, z > 0 ? 0.33 : -0.33);
        sp.rotation.z = -i / 8 * Math.PI * 2; w.add(sp);
      }
      const cap = cyl(0.16, 0.16, 0.66, M.gold, 20); cap.rotation.x = Math.PI / 2; w.add(cap);
      w.position.set(x, 0.97, z); return w;
    };
    g.add(mkWheel(2.9, 1.62), mkWheel(2.9, -1.62), mkWheel(-2.7, 1.62), mkWheel(-2.7, -1.62));
    ([[2.9, 1], [2.9, -1], [-2.7, 1], [-2.7, -1]] as const).forEach(([x, s]) => {
      const arm = box(0.12, 0.5, 0.7, M.dark); arm.position.set(x, 0.85, s * 1.15); g.add(arm);
    });
  }
  { // 04 · the marriage — painted shell
    const g = G.body;
    g.add(P(box(8.9, 0.95, 2.75, M.paint), 0, 1.28, 0));
    g.add(P(box(3.1, 0.34, 2.55, M.paint), 2.85, 1.9, 0));
    g.add(P(box(1.7, 0.6, 2.6, M.paint), -3.55, 2.03, 0));
    ([[2.9, 1.62], [2.9, -1.62], [-2.7, 1.62], [-2.7, -1.62]] as const).forEach(([x, z]) =>
      g.add(P(box(1.7, 0.42, 0.5, M.paint), x, 1.62, z)));
    const wsm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.35, 2.3), M.glass);
    wsm.castShadow = false; wsm.rotation.z = 0.5; wsm.position.set(0.78, 2.42, 0); g.add(wsm);
    const rw = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.9, 2.25), M.glass);
    rw.castShadow = false; rw.rotation.z = -0.4; rw.position.set(-2.62, 2.62, 0); g.add(rw);
    g.add(P(box(2.9, 0.14, 2.35, M.paint), -1.05, 3.12, 0));
    ([[0.35, 1.1], [0.35, -1.1], [-2.45, 1.1], [-2.45, -1.1]] as const).forEach(([x, z]) =>
      g.add(P(box(0.13, 1.35, 0.13, M.paint), x, 2.45, z)));
    g.add(P(box(2.6, 1.05, 0.05, M.glass), -1.05, 2.45, 1.28));
    g.add(P(box(2.6, 1.05, 0.05, M.glass), -1.05, 2.45, -1.28));
  }
  { // 05 · coach doors (rear-hinged)
    const g = G.doors;
    const mkDoor = (side: 1 | -1) => {
      const pivot = new THREE.Group(); pivot.position.set(-1.55, 1.45, side * 1.42);
      const panel = box(2.2, 0.85, 0.13, M.paint); panel.position.set(1.15, 0, 0); pivot.add(panel);
      const handle = box(0.34, 0.06, 0.05, M.gold); handle.position.set(0.5, 0.18, side * 0.09); pivot.add(handle);
      pivot.userData.side = side; return pivot;
    };
    g.add(mkDoor(1), mkDoor(-1));
  }
  { // 06 · brightwork
    const g = G.bright;
    g.add(P(box(0.24, 1.05, 1.45, M.gold), 4.5, 1.42, 0));
    for (let i = 0; i < 7; i++) g.add(P(box(0.1, 0.85, 0.075, M.chrome), 4.58, 1.42, -0.54 + i * 0.18));
    g.add(P(cyl(0.05, 0.12, 0.3, M.gold, 12), 4.55, 2.12, 0));
    const wing = box(0.05, 0.1, 0.5, M.gold); wing.position.set(4.55, 2.3, 0); wing.rotation.x = 0.5; g.add(wing);
    const l1 = cyl(0.27, 0.27, 0.14, M.lamp, 24); l1.rotation.z = Math.PI / 2; g.add(P(l1, 4.42, 1.6, 1.02));
    const l2 = cyl(0.27, 0.27, 0.14, M.lamp, 24); l2.rotation.z = Math.PI / 2; g.add(P(l2, 4.42, 1.6, -1.02));
    g.add(P(box(0.12, 0.36, 0.5, M.tail), -4.42, 1.6, 1.05));
    g.add(P(box(0.12, 0.36, 0.5, M.tail), -4.42, 1.6, -1.05));
    g.add(P(box(0.3, 0.16, 2.9, M.chrome), 4.55, 0.86, 0));
    g.add(P(box(0.3, 0.16, 2.9, M.chrome), -4.5, 0.86, 0));
    g.add(P(box(7.6, 0.045, 0.02, M.gold), 0.1, 1.78, 1.395));
    g.add(P(box(7.6, 0.045, 0.02, M.gold), 0.1, 1.78, -1.395));
  }
  { // 07 · bespoke cabin
    const g = G.cabin;
    const mkSeat = (x: number, z: number) => {
      const s = new THREE.Group();
      s.add(P(box(0.78, 0.3, 0.72, M.leather), 0, 0, 0));
      const back = box(0.72, 0.85, 0.2, M.leather); back.position.set(-0.32, 0.5, 0); back.rotation.z = 0.18; s.add(back);
      s.position.set(x, 1.95, z); return s;
    };
    g.add(mkSeat(0.15, 0.62), mkSeat(0.15, -0.62), mkSeat(-1.7, 0.62), mkSeat(-1.7, -0.62));
    g.add(P(box(0.32, 0.4, 2.2, M.walnut), 1.05, 2.05, 0));
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.045, 10, 32), M.walnut);
    wheel.rotation.y = Math.PI / 2; wheel.rotation.x = 0.4; wheel.castShadow = true;
    g.add(P(wheel, 0.7, 2.25, 0.62));
    const n = 90, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = -2.4 + Math.random() * 2.7; pos[i * 3 + 1] = 3.0; pos[i * 3 + 2] = -1.05 + Math.random() * 2.1;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffe9b0, size: 0.045, transparent: true, opacity: 0.95 })));
  }

  /* ── tween engine ─────────────────────────────────────── */
  type Tween = { t0: number; dur: number; onU: (t: number) => void; onC?: () => void; ease: (t: number) => number };
  const tweens: Tween[] = [];
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  const easeOutBack = (t: number) => { const c = 1.35; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  function tween(dur: number, onU: (t: number) => void, onC?: (() => void) | null, ease = easeOutCubic, delay = 0) {
    tweens.push({ t0: performance.now() + delay, dur, onU, onC: onC ?? undefined, ease });
  }
  function stepTweens(now: number) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      if (now < tw.t0) continue;
      const t = Math.min(1, (now - tw.t0) / tw.dur);
      tw.onU(tw.ease(t));
      if (t >= 1) { tweens.splice(i, 1); tw.onC?.(); }
    }
  }

  function install(group: THREE.Group, done: (() => void) | null, speed = 1) {
    group.visible = true;
    const kids = group.children;
    kids.forEach((k, i) => {
      const fy = k.position.y, fr = k.rotation.x, r0 = fr + (Math.random() * 0.5 - 0.25);
      k.position.y = fy + 7 + i * 0.15; k.rotation.x = r0;
      tween(650 / speed, t => { k.position.y = fy + (7 + i * 0.15) * (1 - t); k.rotation.x = r0 + (fr - r0) * t; },
        null, easeOutBack, i * (85 / speed));
    });
    const total = 650 / speed + kids.length * (85 / speed);
    tween(total, () => {}, () => { sparkle(); done?.(); });
  }

  /* gold sparkle burst */
  const sparkGroups: THREE.Points[] = [];
  function sparkle(x = 0, y = 1.8, z = 0, count = 60) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3); const vel: number[][] = [];
    for (let i = 0; i < count; i++) {
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      vel.push([(Math.random() - 0.5) * 0.16, Math.random() * 0.14 + 0.03, (Math.random() - 0.5) * 0.16]);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xc9a961, size: 0.075, transparent: true, opacity: 1 });
    const pts = new THREE.Points(geo, mat);
    pts.userData = { vel, life: 0 };
    world.add(pts); sparkGroups.push(pts);
  }
  function stepSparkles(dt: number) {
    for (let i = sparkGroups.length - 1; i >= 0; i--) {
      const p = sparkGroups[i];
      p.userData.life += dt;
      const a = p.geometry.attributes.position as THREE.BufferAttribute;
      const v = p.userData.vel as number[][];
      for (let j = 0; j < v.length; j++) {
        v[j][1] -= 0.25 * dt;
        (a.array as Float32Array)[j * 3] += v[j][0];
        (a.array as Float32Array)[j * 3 + 1] += v[j][1];
        (a.array as Float32Array)[j * 3 + 2] += v[j][2];
      }
      a.needsUpdate = true;
      (p.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - p.userData.life / 1.4);
      if (p.userData.life > 1.4) { world.remove(p); sparkGroups.splice(i, 1); }
    }
  }

  /* ── game state ───────────────────────────────────────── */
  let cur = -1, busy = false, released = false, running = false, qcDone = 0, spinFast = false;

  function flyCam(i: number, dur = 1300) {
    const [p, t] = STAGES[i].cam;
    const p0 = camera.position.clone(), t0 = controls.target.clone();
    const p1 = new THREE.Vector3(...(p as [number, number, number]));
    const t1 = new THREE.Vector3(...(t as [number, number, number]));
    tween(dur, k => { camera.position.lerpVectors(p0, p1, k); controls.target.lerpVectors(t0, t1, k); });
  }

  function swingDoors(open: boolean, done?: () => void) {
    G.doors.children.forEach((pivot, i) => {
      const from = pivot.rotation.y, to = open ? pivot.userData.side * 0.9 : 0;
      tween(900, t => { pivot.rotation.y = from + (to - from) * t; }, i === 0 ? done : null, easeOutCubic, i * 120);
    });
  }

  function advance(speed = 1) {
    if (busy || released || cur >= 7) return;
    cur++;
    busy = true;
    hooks.onStage(cur);
    flyCam(cur, 1100 / speed);
    const s = STAGES[cur];
    hooks.onToast(s.t);
    if (s.group) {
      install(G[s.group], () => {
        busy = false;
        const doneStage = cur;
        hooks.onStageDone(doneStage);
        if (doneStage === 4) setTimeout(() => swingDoors(true, () => swingDoors(false)), 350 / speed);
      }, speed);
    } else {
      busy = false;
      setTimeout(() => spawnSeals(), 600);
    }
  }

  function runLine(speed = 1) {
    if (running) return; running = true;
    const next = () => {
      if (disposed) return;
      if (cur >= 6 || released) { running = false; if (cur === 6) advance(speed); return; }
      advance(speed);
      const g = STAGES[Math.min(cur, 6)].group;
      const kids = g ? G[g].children.length : 6;
      const wait = 650 / speed + kids * (85 / speed) + 520 / speed;
      setTimeout(next, wait);
    };
    next();
  }

  /* ── QC seal mini-game ────────────────────────────────── */
  const sealSprites: THREE.Sprite[] = [];
  function sealTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d')!;
    const grd = x.createRadialGradient(64, 64, 4, 64, 64, 60);
    grd.addColorStop(0, 'rgba(255,235,180,1)'); grd.addColorStop(0.35, 'rgba(201,169,97,.9)');
    grd.addColorStop(0.7, 'rgba(201,169,97,.25)'); grd.addColorStop(1, 'rgba(201,169,97,0)');
    x.fillStyle = grd; x.fillRect(0, 0, 128, 128);
    x.strokeStyle = 'rgba(176,141,62,.95)'; x.lineWidth = 3;
    x.beginPath(); x.arc(64, 64, 34, 0, Math.PI * 2); x.stroke();
    return new THREE.CanvasTexture(c);
  }
  function spawnSeals() {
    const tex = sealTexture();
    SEALS.forEach((s, i) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      sp.position.set(s.p[0], s.p[1], s.p[2]); sp.scale.set(0.85, 0.85, 1);
      sp.userData = { i, label: s.label, alive: true, phase: i * 1.1 };
      world.add(sp); sealSprites.push(sp);
    });
    hooks.onQCSpawn();
  }
  function certify(sp: THREE.Sprite) {
    if (!sp.userData.alive) return;
    sp.userData.alive = false; qcDone++;
    hooks.onQCCheck(sp.userData.i, qcDone);
    hooks.onStamp('Passed', sp.userData.label, 900);
    sparkle(sp.position.x, sp.position.y, sp.position.z, 30);
    tween(420, t => { sp.scale.setScalar(0.85 * (1 + t * 0.9)); sp.material.opacity = 1 - t; }, () => world.remove(sp));
    if (qcDone === 6) release();
  }
  function release() {
    released = true;
    cur = 7;
    hooks.onStageDone(7);
    setTimeout(() => {
      hooks.onStamp('Released', 'Commission Nº 001 · Aurelia Coachworks', 2600);
      for (let i = 0; i < 5; i++) {
        setTimeout(() => sparkle((Math.random() - 0.5) * 6, 2 + Math.random() * 2, (Math.random() - 0.5) * 3, 80), i * 160);
      }
      spinFast = true;
      flyCam(7, 1600);
      hooks.onReleased();
    }, 300);
  }

  /* raycast clicks (ignore drags) */
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  let downAt: [number, number] | null = null;
  const onDown = (e: PointerEvent) => { downAt = [e.clientX, e.clientY]; };
  const onUp = (e: PointerEvent) => {
    if (!downAt) return;
    const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]); downAt = null;
    if (moved > 6 || !sealSprites.length) return;
    const r = renderer.domElement.getBoundingClientRect();
    mouse.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, camera);
    const hits = ray.intersectObjects(sealSprites.filter(s => s.userData.alive));
    if (hits.length) certify(hits[0].object as THREE.Sprite);
  };
  renderer.domElement.addEventListener('pointerdown', onDown);
  renderer.domElement.addEventListener('pointerup', onUp);

  /* demo mode — cinematic auto-run used for the 15s recording */
  let autoQC: ReturnType<typeof setInterval> | null = null;
  function startDemo() {
    setTimeout(() => runLine(2.6), 350);
    autoQC = setInterval(() => {
      const alive = sealSprites.filter(s => s.userData.alive);
      if (released) { if (autoQC) clearInterval(autoQC); return; }
      if (alive.length && !busy) certify(alive[0]);
    }, 420);
  }

  /* ── frame loop ───────────────────────────────────────── */
  let disposed = false;
  let raf = 0, last = performance.now();
  function frame(now: number) {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    stepTweens(now);
    stepSparkles(dt);
    world.rotation.y += (spinFast ? 0.55 : 0.07) * dt;
    sealSprites.forEach(s => {
      if (s.userData.alive) {
        s.userData.phase += dt * 3;
        s.scale.setScalar(0.85 + Math.sin(s.userData.phase) * 0.09);
      }
    });
    controls.update();
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  const onResize = () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  };
  window.addEventListener('resize', onResize);

  return {
    advance: () => advance(),
    runLine: (speed = 1.6) => runLine(speed),
    startDemo,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      if (autoQC) clearInterval(autoQC);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      controls.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
