import * as THREE from 'three';
import type { MedievalMaterialLibrary } from '../MaterialLibrary';
import {
  addBox,
  addGableRoof,
  addPrimitive,
  createObjectGroup,
  type MedievalGeometryLibrary,
} from './MedievalModelKit';
import type { LandmarkId } from '../../world/VillageTypes';

export interface MedievalBuildingContext {
  readonly materials: MedievalMaterialLibrary;
  readonly geometries: MedievalGeometryLibrary;
}

export interface MedievalBuildingModel {
  readonly root: THREE.Group;
  readonly localColliderBoxes: readonly THREE.Box3[];
  readonly interactionOffset: THREE.Vector3;
  readonly animations: readonly ((elapsedSeconds: number) => void)[];
}

interface HouseShellOptions {
  readonly width: number;
  readonly depth: number;
  readonly wallHeight: number;
  readonly roofHeight: number;
  readonly wall: THREE.Material;
  readonly roof: THREE.Material;
  readonly timberFrame?: boolean;
  readonly upperOverhang?: number;
  readonly frontWindows?: number;
  readonly sideWindows?: boolean;
  readonly hasDoor?: boolean;
  readonly doorOffset?: number;
  readonly windowMaterial?: THREE.Material;
}

const FOUNDATION_HEIGHT = 0.36;

function localBox(width: number, depth: number, height: number, centerZ = 0): THREE.Box3 {
  return new THREE.Box3(
    new THREE.Vector3(-width / 2, 0, centerZ - depth / 2),
    new THREE.Vector3(width / 2, height, centerZ + depth / 2),
  );
}

function addDoor(
  root: THREE.Object3D,
  context: MedievalBuildingContext,
  depth: number,
  x = 0,
  material: THREE.Material = context.materials.timberDark,
): void {
  addBox(root, context.geometries.box, material, 'door', [0.92, 1.55, 0.14], [x, 1.12, depth / 2 + 0.08]);
  addPrimitive(
    root,
    context.geometries.sphere6,
    context.materials.reward,
    'door-handle',
    [0.1, 0.1, 0.08],
    [x + 0.28, 1.12, depth / 2 + 0.18],
  );
}

function addFrontWindows(
  root: THREE.Object3D,
  context: MedievalBuildingContext,
  width: number,
  depth: number,
  count: number,
  y: number,
  material: THREE.Material,
): void {
  if (count <= 0) return;
  const usable = width - 1.3;
  for (let index = 0; index < count; index += 1) {
    const x = count === 1 ? 0 : -usable / 2 + (usable * index) / (count - 1);
    if (Math.abs(x) < 0.65 && y < 2.1) continue;
    addBox(
      root,
      context.geometries.box,
      context.materials.timberDark,
      `front-window-frame-${index}`,
      [0.78, 0.96, 0.13],
      [x, y, depth / 2 + 0.07],
    );
    addBox(
      root,
      context.geometries.box,
      material,
      `front-window-glass-${index}`,
      [0.56, 0.72, 0.15],
      [x, y, depth / 2 + 0.15],
    );
    addBox(
      root,
      context.geometries.box,
      context.materials.timberDark,
      `front-window-mullion-${index}`,
      [0.08, 0.78, 0.18],
      [x, y, depth / 2 + 0.18],
    );
  }
}

function addSideWindows(
  root: THREE.Object3D,
  context: MedievalBuildingContext,
  width: number,
  depth: number,
  y: number,
  material: THREE.Material,
): void {
  for (const side of [-1, 1]) {
    for (const z of [-depth * 0.22, depth * 0.22]) {
      addBox(
        root,
        context.geometries.box,
        context.materials.timberDark,
        `side-window-frame-${side}-${z}`,
        [0.14, 0.9, 0.75],
        [side * (width / 2 + 0.07), y, z],
      );
      addBox(
        root,
        context.geometries.box,
        material,
        `side-window-glass-${side}-${z}`,
        [0.16, 0.66, 0.53],
        [side * (width / 2 + 0.15), y, z],
      );
    }
  }
}

function addTimberFrame(
  root: THREE.Object3D,
  context: MedievalBuildingContext,
  width: number,
  depth: number,
  wallHeight: number,
): void {
  const frontZ = depth / 2 + 0.09;
  for (const x of [-width / 2 + 0.16, 0, width / 2 - 0.16]) {
    addBox(
      root,
      context.geometries.box,
      context.materials.timberDark,
      `timber-post-${x}`,
      [0.22, wallHeight, 0.18],
      [x, FOUNDATION_HEIGHT + wallHeight / 2, frontZ],
    );
  }
  for (const y of [FOUNDATION_HEIGHT + 0.16, FOUNDATION_HEIGHT + wallHeight * 0.55, FOUNDATION_HEIGHT + wallHeight - 0.16]) {
    addBox(
      root,
      context.geometries.box,
      context.materials.timberDark,
      `timber-beam-${y}`,
      [width, 0.2, 0.18],
      [0, y, frontZ],
    );
  }
  for (const side of [-1, 1]) {
    addBox(
      root,
      context.geometries.box,
      context.materials.timberDark,
      `timber-diagonal-${side}`,
      [width * 0.42, 0.18, 0.18],
      [side * width * 0.25, FOUNDATION_HEIGHT + wallHeight * 0.72, frontZ + 0.015],
      { rotation: [0, 0, side * 0.42] },
    );
  }
}

function addHouseShell(
  root: THREE.Object3D,
  context: MedievalBuildingContext,
  options: HouseShellOptions,
): void {
  const {
    width,
    depth,
    wallHeight,
    roofHeight,
    wall,
    roof,
    timberFrame = false,
    upperOverhang = 0,
    frontWindows = 2,
    sideWindows = true,
    hasDoor = true,
    doorOffset = 0,
    windowMaterial = context.materials.windowWarm,
  } = options;

  addBox(
    root,
    context.geometries.box,
    context.materials.stoneDark,
    'stone-foundation',
    [width + 0.3, FOUNDATION_HEIGHT, depth + 0.3],
    [0, FOUNDATION_HEIGHT / 2, 0],
    { receiveShadow: true },
  );
  addBox(
    root,
    context.geometries.box,
    wall,
    'main-wall-volume',
    [width + upperOverhang, wallHeight, depth + upperOverhang],
    [0, FOUNDATION_HEIGHT + wallHeight / 2, 0],
    { castShadow: true, receiveShadow: true },
  );
  addGableRoof(
    root,
    context.geometries.gableRoof,
    roof,
    'gable-roof',
    [width + 0.9 + upperOverhang, roofHeight * 2, depth + 0.85 + upperOverhang],
    [0, FOUNDATION_HEIGHT + wallHeight, 0],
    { castShadow: true, receiveShadow: true },
  );
  if (hasDoor) addDoor(root, context, depth + upperOverhang, doorOffset);
  addFrontWindows(root, context, width + upperOverhang, depth + upperOverhang, frontWindows, 1.85, windowMaterial);
  if (sideWindows) {
    addSideWindows(root, context, width + upperOverhang, depth + upperOverhang, 1.85, windowMaterial);
  }
  if (timberFrame) addTimberFrame(root, context, width + upperOverhang, depth + upperOverhang, wallHeight);
}

function addChimney(
  root: THREE.Object3D,
  context: MedievalBuildingContext,
  position: readonly [number, number, number],
  height = 2.1,
): THREE.Group {
  const chimney = createObjectGroup('chimney');
  chimney.position.set(...position);
  addBox(
    chimney,
    context.geometries.box,
    context.materials.stoneDark,
    'chimney-stack',
    [0.72, height, 0.72],
    [0, height / 2, 0],
    { castShadow: true },
  );
  addBox(
    chimney,
    context.geometries.box,
    context.materials.stone,
    'chimney-cap',
    [0.9, 0.24, 0.9],
    [0, height + 0.06, 0],
  );
  root.add(chimney);
  return chimney;
}

function addBanner(
  root: THREE.Object3D,
  context: MedievalBuildingContext,
  name: string,
  x: number,
  y: number,
  z: number,
  material: THREE.Material,
): THREE.Group {
  const banner = createObjectGroup(name);
  banner.position.set(x, y, z);
  addBox(banner, context.geometries.box, context.materials.iron, 'banner-rail', [1, 0.08, 0.08], [0, 0.28, 0]);
  addBox(banner, context.geometries.box, material, 'banner-cloth', [0.78, 1.28, 0.08], [0, -0.38, 0]);
  addPrimitive(
    banner,
    context.geometries.cone4,
    material,
    'banner-tail',
    [0.56, 0.48, 0.12],
    [0, -1.13, 0],
    { rotation: [0, 0, Math.PI / 4] },
  );
  root.add(banner);
  return banner;
}

function addQuestBoard(root: THREE.Object3D, context: MedievalBuildingContext, x: number, z: number): void {
  const board = createObjectGroup('quest-board');
  board.position.set(x, 0, z);
  addBox(board, context.geometries.box, context.materials.timberDark, 'quest-board-post-left', [0.16, 1.75, 0.16], [-0.7, 0.88, 0]);
  addBox(board, context.geometries.box, context.materials.timberDark, 'quest-board-post-right', [0.16, 1.75, 0.16], [0.7, 0.88, 0]);
  addBox(board, context.geometries.box, context.materials.woodLight, 'quest-board-panel', [1.65, 1.05, 0.14], [0, 1.18, 0]);
  const notePositions = [
    [-0.46, 1.32],
    [0.05, 1.04],
    [0.48, 1.4],
  ] as const;
  notePositions.forEach(([noteX, noteY], index) => {
    addBox(
      board,
      context.geometries.box,
      context.materials.decalLight,
      `quest-note-${index}`,
      [0.38, 0.44, 0.025],
      [noteX, noteY, 0.085],
      { rotation: [0, 0, (index - 1) * 0.08] },
    );
  });
  root.add(board);
}

function addBarrel(root: THREE.Object3D, context: MedievalBuildingContext, x: number, z: number, scale = 1): void {
  addPrimitive(
    root,
    context.geometries.cylinder8,
    context.materials.timber,
    'barrel-body',
    [0.64 * scale, 0.9 * scale, 0.64 * scale],
    [x, 0.45 * scale, z],
  );
  for (const y of [0.18, 0.7]) {
    addPrimitive(
      root,
      context.geometries.cylinder8,
      context.materials.iron,
      'barrel-band',
      [0.67 * scale, 0.08 * scale, 0.67 * scale],
      [x, y * scale, z],
    );
  }
}

function createGuild(context: MedievalBuildingContext): MedievalBuildingModel {
  const root = createObjectGroup('landmark-guild');
  root.userData.landmarkId = 'guild';
  addHouseShell(root, context, {
    width: 7.6,
    depth: 5.2,
    wallHeight: 3.7,
    roofHeight: 2.15,
    wall: context.materials.plaster,
    roof: context.materials.roofSlate,
    timberFrame: true,
    upperOverhang: 0.25,
    frontWindows: 4,
    doorOffset: 0,
  });

  const porch = createObjectGroup('guild-porch');
  for (const x of [-2.15, 2.15]) {
    addPrimitive(porch, context.geometries.cylinder6, context.materials.stone, 'porch-column', [0.48, 2.35, 0.48], [x, 1.18, 3.35]);
  }
  addBox(porch, context.geometries.box, context.materials.timberDark, 'porch-beam', [5.1, 0.3, 0.36], [0, 2.4, 3.35]);
  addGableRoof(porch, context.geometries.gableRoof, context.materials.accents.guild, 'porch-roof', [5.1, 1.25, 2.1], [0, 2.45, 2.9], { castShadow: true });
  root.add(porch);

  addBanner(root, context, 'guild-banner-left', -2.7, 3.2, 2.78, context.materials.accents.guild);
  addBanner(root, context, 'guild-banner-right', 2.7, 3.2, 2.78, context.materials.accents.guild);
  addQuestBoard(root, context, 4.5, 2.05);

  const crest = createObjectGroup('guild-crest');
  crest.position.set(0, 3.35, 2.82);
  addPrimitive(crest, context.geometries.cylinder6, context.materials.trim, 'crest-shield', [1.05, 0.18, 1.22], [0, 0, 0], { rotation: [Math.PI / 2, 0, 0] });
  addBox(crest, context.geometries.box, context.materials.accents.guild, 'crest-stripe', [0.18, 0.9, 0.2], [0, 0, 0.16]);
  root.add(crest);

  return {
    root,
    localColliderBoxes: [localBox(8.1, 5.75, 6.2)],
    interactionOffset: new THREE.Vector3(0, 0, 4.65),
    animations: [],
  };
}

function createTavern(context: MedievalBuildingContext): MedievalBuildingModel {
  const root = createObjectGroup('landmark-tavern');
  root.userData.landmarkId = 'tavern';
  addHouseShell(root, context, {
    width: 6.1,
    depth: 4.9,
    wallHeight: 3.25,
    roofHeight: 1.85,
    wall: context.materials.plaster,
    roof: context.materials.roofTerracotta,
    timberFrame: true,
    upperOverhang: 0.48,
    frontWindows: 3,
    doorOffset: -0.75,
  });
  const sideWing = createObjectGroup('tavern-side-wing');
  sideWing.position.set(-3.15, 0, -0.45);
  sideWing.rotation.y = Math.PI / 2;
  addHouseShell(sideWing, context, {
    width: 3.2,
    depth: 3.3,
    wallHeight: 2.35,
    roofHeight: 1.4,
    wall: context.materials.plaster,
    roof: context.materials.roofTerracotta,
    timberFrame: true,
    frontWindows: 1,
    sideWindows: false,
    hasDoor: false,
  });
  root.add(sideWing);
  addChimney(root, context, [2.05, 3.15, -0.75], 2.3);
  addBarrel(root, context, -3.85, 1.8);
  addBarrel(root, context, -4.45, 1.55, 0.82);

  const sign = createObjectGroup('tavern-hanging-sign');
  sign.userData.dynamic = true;
  sign.position.set(2.9, 2.4, 2.7);
  addBox(sign, context.geometries.box, context.materials.iron, 'sign-bracket-horizontal', [1.7, 0.12, 0.12], [0.55, 0.45, 0]);
  addBox(sign, context.geometries.box, context.materials.iron, 'sign-chain', [0.08, 0.65, 0.08], [1.25, 0.12, 0]);
  addBox(sign, context.geometries.box, context.materials.accents.tavern, 'sign-board', [1.12, 0.94, 0.12], [1.25, -0.48, 0]);
  addPrimitive(sign, context.geometries.torus8, context.materials.trim, 'sign-tankard', [0.36, 0.42, 0.18], [1.25, -0.48, 0.11]);
  root.add(sign);

  return {
    root,
    localColliderBoxes: [
      localBox(6.9, 5.7, 5.5),
      new THREE.Box3(new THREE.Vector3(-4.9, 0, -2.15), new THREE.Vector3(-1.4, 4.2, 1.25)),
    ],
    interactionOffset: new THREE.Vector3(-0.75, 0, 4.15),
    animations: [(elapsed) => { sign.rotation.z = Math.sin(elapsed * 1.15) * 0.025; }],
  };
}

function createForge(context: MedievalBuildingContext): MedievalBuildingModel {
  const root = createObjectGroup('landmark-forge');
  root.userData.landmarkId = 'forge';
  addHouseShell(root, context, {
    width: 5.8,
    depth: 4.5,
    wallHeight: 2.75,
    roofHeight: 1.35,
    wall: context.materials.stone,
    roof: context.materials.roofSlate,
    frontWindows: 1,
    sideWindows: false,
    doorOffset: 1.65,
    windowMaterial: context.materials.forgeGlow,
  });
  addChimney(root, context, [-1.65, 2.55, -0.85], 4.1);

  const furnace = createObjectGroup('forge-furnace');
  furnace.position.set(-1.45, 0, 2.35);
  addBox(furnace, context.geometries.box, context.materials.stoneDark, 'furnace-surround', [2.25, 2, 0.72], [0, 1.05, 0]);
  const fire = addBox(furnace, context.geometries.box, context.materials.forgeGlow, 'furnace-fire', [1.15, 0.82, 0.16], [0, 0.8, 0.43]);
  fire.userData.dynamic = true;
  addBox(furnace, context.geometries.box, context.materials.iron, 'furnace-lintel', [1.55, 0.18, 0.18], [0, 1.36, 0.46]);
  root.add(furnace);

  const awning = createObjectGroup('forge-work-awning');
  addBox(awning, context.geometries.box, context.materials.timberDark, 'awning-post-left', [0.18, 2, 0.18], [-2.45, 1, 3.45]);
  addBox(awning, context.geometries.box, context.materials.timberDark, 'awning-post-right', [0.18, 2, 0.18], [2.45, 1, 3.45]);
  addBox(awning, context.geometries.box, context.materials.accents.forge, 'awning-roof', [5.25, 0.2, 2], [0, 2.12, 2.85], { rotation: [0.16, 0, 0], castShadow: true });
  root.add(awning);

  const anvil = createObjectGroup('forge-anvil');
  anvil.position.set(1.45, 0, 3.15);
  addBox(anvil, context.geometries.box, context.materials.iron, 'anvil-foot', [0.62, 0.25, 0.62], [0, 0.13, 0]);
  addBox(anvil, context.geometries.box, context.materials.iron, 'anvil-stem', [0.35, 0.65, 0.35], [0, 0.52, 0]);
  addBox(anvil, context.geometries.box, context.materials.metalBright, 'anvil-top', [1.25, 0.32, 0.55], [0.18, 0.92, 0]);
  root.add(anvil);

  return {
    root,
    localColliderBoxes: [localBox(6.35, 5.05, 4.8), localBox(5.2, 1.8, 2.3, 2.95)],
    interactionOffset: new THREE.Vector3(0.7, 0, 5.05),
    animations: [(elapsed) => { fire.scale.y = 0.92 + Math.sin(elapsed * 5.2) * 0.08; }],
  };
}

function createLibrary(context: MedievalBuildingContext): MedievalBuildingModel {
  const root = createObjectGroup('landmark-library');
  root.userData.landmarkId = 'library';
  addHouseShell(root, context, {
    width: 6.2,
    depth: 4.7,
    wallHeight: 4.45,
    roofHeight: 1.7,
    wall: context.materials.plaster,
    roof: context.materials.roofMoss,
    timberFrame: false,
    frontWindows: 3,
    windowMaterial: context.materials.windowCool,
  });
  addFrontWindows(root, context, 6.2, 4.7, 3, 3.18, context.materials.windowCool);
  for (const x of [-2.55, 2.55]) {
    addBox(root, context.geometries.box, context.materials.stone, 'library-buttress', [0.5, 3.6, 0.65], [x, 1.8, 2.48]);
  }
  const readingTower = createObjectGroup('library-reading-tower');
  readingTower.position.set(-3.45, 0, -0.35);
  addPrimitive(readingTower, context.geometries.cylinder8, context.materials.stone, 'reading-tower-body', [2.25, 4.85, 2.25], [0, 2.43, 0], { castShadow: true, receiveShadow: true });
  addPrimitive(readingTower, context.geometries.cone8, context.materials.roofMoss, 'reading-tower-roof', [2.75, 2.2, 2.75], [0, 5.9, 0], { castShadow: true });
  for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    addBox(
      readingTower,
      context.geometries.box,
      context.materials.windowCool,
      'tower-window',
      [0.48, 0.82, 0.12],
      [Math.sin(angle) * 1.1, 3.4, Math.cos(angle) * 1.1],
      { rotation: [0, angle, 0] },
    );
  }
  root.add(readingTower);

  const scroll = createObjectGroup('library-scroll-sign');
  scroll.position.set(1.45, 3.1, 2.47);
  addBox(scroll, context.geometries.box, context.materials.decalLight, 'scroll-paper', [1.25, 0.72, 0.1], [0, 0, 0]);
  for (const x of [-0.68, 0.68]) {
    addPrimitive(scroll, context.geometries.cylinder6, context.materials.trim, 'scroll-roller', [0.16, 0.95, 0.16], [x, 0, 0], { rotation: [0, 0, Math.PI / 2] });
  }
  root.add(scroll);

  return {
    root,
    localColliderBoxes: [localBox(6.7, 5.2, 6.5), new THREE.Box3(new THREE.Vector3(-4.65, 0, -1.55), new THREE.Vector3(-2.25, 7, 0.85))],
    interactionOffset: new THREE.Vector3(0, 0, 4.05),
    animations: [],
  };
}

function createChurch(context: MedievalBuildingContext): MedievalBuildingModel {
  const root = createObjectGroup('landmark-church');
  root.userData.landmarkId = 'church';
  addBox(root, context.geometries.box, context.materials.stoneDark, 'church-foundation', [5.5, 0.4, 8.4], [0, 0.2, 0], { receiveShadow: true });
  addBox(root, context.geometries.box, context.materials.plasterWhite, 'church-nave', [5.1, 3.55, 7.9], [0, 2.12, 0], { castShadow: true, receiveShadow: true });
  addGableRoof(root, context.geometries.gableRoof, context.materials.roofSlate, 'church-nave-roof', [5.8, 2.65, 8.55], [0, 3.9, 0], { castShadow: true });
  addBox(root, context.geometries.box, context.materials.plasterWhite, 'church-transept', [7.1, 2.8, 2.8], [0, 1.8, -0.7], { castShadow: true, receiveShadow: true });
  addGableRoof(root, context.geometries.gableRoof, context.materials.roofSlate, 'church-transept-roof', [3.45, 2, 7.6], [0, 3.2, -0.7], { rotation: [0, Math.PI / 2, 0], castShadow: true });

  const tower = createObjectGroup('church-bell-tower');
  tower.position.set(0, 0, 3.1);
  addBox(tower, context.geometries.box, context.materials.stone, 'bell-tower-base', [2.7, 6.2, 2.55], [0, 3.1, 0], { castShadow: true, receiveShadow: true });
  addBox(tower, context.geometries.box, context.materials.accents.church, 'bell-tower-band', [2.92, 0.32, 2.77], [0, 5.15, 0]);
  for (const side of [-1, 1]) {
    addBox(tower, context.geometries.box, context.materials.decalDark, 'bell-opening-front', [0.54, 1.05, 0.16], [side * 0.62, 4.55, 1.34]);
  }
  addPrimitive(tower, context.geometries.cone4, context.materials.roofSlate, 'bell-tower-spire', [3.45, 3.35, 3.45], [0, 7.85, 0], { rotation: [0, Math.PI / 4, 0], castShadow: true });
  const cross = createObjectGroup('church-cross');
  cross.position.set(0, 9.65, 0);
  addBox(cross, context.geometries.box, context.materials.trim, 'cross-vertical', [0.18, 1.25, 0.18], [0, 0, 0]);
  addBox(cross, context.geometries.box, context.materials.trim, 'cross-horizontal', [0.75, 0.18, 0.18], [0, 0.18, 0]);
  tower.add(cross);
  root.add(tower);

  for (const z of [-2.2, -0.6, 1]) {
    for (const side of [-1, 1]) {
      addBox(root, context.geometries.box, context.materials.accents.church, 'stained-window-frame', [0.15, 1.35, 0.78], [side * 2.62, 2.15, z]);
      addBox(root, context.geometries.box, context.materials.windowCool, 'stained-window-glass', [0.17, 1.08, 0.55], [side * 2.7, 2.15, z]);
    }
  }
  addDoor(root, context, 8.4, 0, context.materials.timberDark);

  return {
    root,
    localColliderBoxes: [localBox(5.7, 8.55, 5.4), new THREE.Box3(new THREE.Vector3(-1.55, 0, 1.7), new THREE.Vector3(1.55, 10, 4.5))],
    interactionOffset: new THREE.Vector3(0, 0, 5.55),
    animations: [],
  };
}

function createMageTower(context: MedievalBuildingContext): MedievalBuildingModel {
  const root = createObjectGroup('landmark-mage-tower');
  root.userData.landmarkId = 'mageTower';
  addPrimitive(root, context.geometries.cylinder8, context.materials.stoneDark, 'mage-tower-foundation', [5.3, 0.5, 5.3], [0, 0.25, 0], { receiveShadow: true });
  addPrimitive(root, context.geometries.cylinder8, context.materials.stone, 'mage-tower-body', [4.65, 7.5, 4.65], [0, 4.0, 0], { castShadow: true, receiveShadow: true });
  for (const y of [1.25, 3.75, 6.3]) {
    addPrimitive(root, context.geometries.cylinder8, context.materials.accents.mageTower, `mage-tower-band-${y}`, [4.9, 0.28, 4.9], [0, y, 0]);
  }
  addPrimitive(root, context.geometries.cone8, context.materials.accents.mageTower, 'mage-tower-roof', [6, 4.25, 6], [0, 9.75, 0], { castShadow: true });
  addDoor(root, context, 4.65, 0, context.materials.timberDark);
  for (const [angle, y] of [[0, 3], [Math.PI / 2, 4.6], [Math.PI, 6.2], [Math.PI * 1.5, 3.8]] as const) {
    addBox(
      root,
      context.geometries.box,
      context.materials.magicGlow,
      'mage-window',
      [0.52, 0.95, 0.16],
      [Math.sin(angle) * 2.33, y, Math.cos(angle) * 2.33],
      { rotation: [0, angle, 0] },
    );
  }

  const crystal = createObjectGroup('mage-roof-crystal');
  crystal.userData.dynamic = true;
  crystal.position.set(0, 12.2, 0);
  const crystalTop = addPrimitive(crystal, context.geometries.cone4, context.materials.magicGlow, 'crystal-top', [0.8, 1.25, 0.8], [0, 0.52, 0]);
  addPrimitive(crystal, context.geometries.cone4, context.materials.magicGlow, 'crystal-bottom', [0.8, 1.25, 0.8], [0, -0.52, 0], { rotation: [Math.PI, 0, 0] });
  root.add(crystal);

  const annex = createObjectGroup('mage-tower-annex');
  annex.position.set(2.55, 0, -0.4);
  addBox(annex, context.geometries.box, context.materials.stone, 'annex-wall', [2.6, 2.25, 2.8], [0, 1.3, 0], { castShadow: true });
  addGableRoof(annex, context.geometries.gableRoof, context.materials.roofSlate, 'annex-roof', [3.05, 1.5, 3.25], [0, 2.42, 0], { castShadow: true });
  root.add(annex);

  return {
    root,
    localColliderBoxes: [localBox(5.25, 5.25, 12.9), new THREE.Box3(new THREE.Vector3(1.2, 0, -1.9), new THREE.Vector3(4.1, 3.3, 1.1))],
    interactionOffset: new THREE.Vector3(0, 0, 4.2),
    animations: [(elapsed) => {
      crystal.rotation.y = elapsed * 0.62;
      crystal.position.y = 12.2 + Math.sin(elapsed * 1.8) * 0.12;
      crystalTop.rotation.y = elapsed * -0.3;
    }],
  };
}

function createMarket(context: MedievalBuildingContext): MedievalBuildingModel {
  const root = createObjectGroup('landmark-market');
  root.userData.landmarkId = 'market';
  const colliders: THREE.Box3[] = [];
  const stallData = [
    [-3.2, -2.2, 0],
    [3.2, -2.2, Math.PI],
    [-3.2, 2.2, 0],
    [3.2, 2.2, Math.PI],
  ] as const;
  const canopies: THREE.Group[] = [];
  stallData.forEach(([x, z, rotation], index) => {
    const stall = createObjectGroup(`market-stall-${index}`);
    stall.position.set(x, 0, z);
    stall.rotation.y = rotation;
    addBox(stall, context.geometries.box, context.materials.timber, 'stall-counter', [2.5, 0.65, 1.05], [0, 0.92, 0]);
    for (const postX of [-1.05, 1.05]) {
      addBox(stall, context.geometries.box, context.materials.timberDark, 'stall-post', [0.14, 2.4, 0.14], [postX, 1.2, 0]);
    }
    const canopy = createObjectGroup('stall-canopy');
    canopy.userData.dynamic = true;
    addBox(canopy, context.geometries.box, index % 2 === 0 ? context.materials.accents.market : context.materials.hazard, 'canopy-cloth', [2.75, 0.16, 1.65], [0, 2.35, 0], { rotation: [0.08, 0, 0], castShadow: true });
    stall.add(canopy);
    canopies.push(canopy);
    addPrimitive(stall, context.geometries.sphere6, context.materials.reward, 'market-produce-gold', [0.28, 0.28, 0.28], [-0.58, 1.36, 0]);
    addPrimitive(stall, context.geometries.sphere6, context.materials.foliageLight, 'market-produce-green', [0.3, 0.3, 0.3], [0.05, 1.36, 0]);
    addPrimitive(stall, context.geometries.sphere6, context.materials.hazard, 'market-produce-red', [0.26, 0.26, 0.26], [0.62, 1.36, 0]);
    root.add(stall);
    colliders.push(new THREE.Box3(new THREE.Vector3(x - 1.4, 0, z - 0.7), new THREE.Vector3(x + 1.4, 2.7, z + 0.7)));
  });

  const pavilion = createObjectGroup('market-pavilion');
  for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    addPrimitive(
      pavilion,
      context.geometries.cylinder6,
      context.materials.timberDark,
      'pavilion-column',
      [0.28, 3, 0.28],
      [Math.sin(angle) * 1.55, 1.5, Math.cos(angle) * 1.55],
    );
  }
  addPrimitive(pavilion, context.geometries.cone8, context.materials.accents.market, 'pavilion-roof', [4.4, 2.05, 4.4], [0, 3.65, 0], { castShadow: true });
  root.add(pavilion);

  return {
    root,
    localColliderBoxes: colliders,
    interactionOffset: new THREE.Vector3(0, 0, 0),
    animations: [(elapsed) => {
      canopies.forEach((canopy, index) => { canopy.rotation.z = Math.sin(elapsed * 1.2 + index) * 0.012; });
    }],
  };
}

function createHospital(context: MedievalBuildingContext): MedievalBuildingModel {
  const root = createObjectGroup('landmark-hospital');
  root.userData.landmarkId = 'hospital';
  addHouseShell(root, context, {
    width: 6.5,
    depth: 4.8,
    wallHeight: 3.3,
    roofHeight: 1.55,
    wall: context.materials.plasterWhite,
    roof: context.materials.accents.hospital,
    frontWindows: 3,
    sideWindows: true,
    windowMaterial: context.materials.windowCool,
  });
  const entry = createObjectGroup('hospital-entry-canopy');
  addBox(entry, context.geometries.box, context.materials.accents.hospital, 'hospital-canopy', [2.75, 0.22, 1.55], [0, 2.05, 3.05], { rotation: [0.08, 0, 0], castShadow: true });
  for (const x of [-1.15, 1.15]) {
    addBox(entry, context.geometries.box, context.materials.woodLight, 'hospital-canopy-post', [0.14, 2, 0.14], [x, 1, 3.45]);
  }
  root.add(entry);
  const cross = createObjectGroup('hospital-herbal-cross');
  cross.position.set(0, 3.05, 2.55);
  addBox(cross, context.geometries.box, context.materials.accents.hospital, 'hospital-cross-vertical', [0.32, 1.3, 0.15], [0, 0, 0]);
  addBox(cross, context.geometries.box, context.materials.accents.hospital, 'hospital-cross-horizontal', [1.3, 0.32, 0.15], [0, 0, 0]);
  root.add(cross);
  for (const x of [-2.35, 2.35]) {
    const planter = createObjectGroup('hospital-herb-planter');
    planter.position.set(x, 0, 3.35);
    addBox(planter, context.geometries.box, context.materials.woodLight, 'planter-box', [1.25, 0.45, 0.72], [0, 0.23, 0]);
    for (const plantX of [-0.4, 0, 0.4]) {
      addPrimitive(planter, context.geometries.cone6, context.materials.foliageLight, 'herb', [0.22, 0.6, 0.22], [plantX, 0.72, 0]);
    }
    root.add(planter);
  }

  return {
    root,
    localColliderBoxes: [localBox(7, 5.3, 5.25), localBox(2.8, 1.25, 2.2, 3.15)],
    interactionOffset: new THREE.Vector3(0, 0, 4.5),
    animations: [],
  };
}

function createHome(context: MedievalBuildingContext): MedievalBuildingModel {
  const root = createObjectGroup('landmark-home');
  root.userData.landmarkId = 'home';
  addHouseShell(root, context, {
    width: 5.2,
    depth: 4.15,
    wallHeight: 2.75,
    roofHeight: 1.6,
    wall: context.materials.plaster,
    roof: context.materials.accents.home,
    timberFrame: true,
    frontWindows: 2,
    sideWindows: true,
    doorOffset: 0,
  });
  addChimney(root, context, [1.6, 2.55, -0.45], 2.1);
  const porch = createObjectGroup('home-porch');
  addBox(porch, context.geometries.box, context.materials.woodLight, 'porch-deck', [3.5, 0.2, 1.25], [0, 0.28, 2.55], { receiveShadow: true });
  for (const x of [-1.35, 1.35]) {
    addBox(porch, context.geometries.box, context.materials.timberDark, 'porch-post', [0.14, 1.85, 0.14], [x, 1.2, 2.85]);
  }
  addBox(porch, context.geometries.box, context.materials.accents.home, 'porch-roof', [3.45, 0.18, 1.55], [0, 2.15, 2.48], { rotation: [0.11, 0, 0], castShadow: true });
  root.add(porch);
  const mailbox = createObjectGroup('home-mailbox');
  mailbox.position.set(3.15, 0, 2.7);
  addBox(mailbox, context.geometries.box, context.materials.timberDark, 'mailbox-post', [0.13, 1.2, 0.13], [0, 0.6, 0]);
  addBox(mailbox, context.geometries.box, context.materials.accents.home, 'mailbox-box', [0.65, 0.45, 0.85], [0, 1.15, 0]);
  addBox(mailbox, context.geometries.box, context.materials.hazard, 'mailbox-flag', [0.08, 0.55, 0.08], [0.38, 1.42, 0]);
  root.add(mailbox);

  return {
    root,
    localColliderBoxes: [localBox(5.75, 4.7, 4.7), localBox(3.6, 1.5, 2.35, 2.5)],
    interactionOffset: new THREE.Vector3(0, 0, 4.1),
    animations: [],
  };
}

export function createLandmarkBuilding(id: LandmarkId, context: MedievalBuildingContext): MedievalBuildingModel {
  switch (id) {
    case 'guild': return createGuild(context);
    case 'tavern': return createTavern(context);
    case 'forge': return createForge(context);
    case 'library': return createLibrary(context);
    case 'church': return createChurch(context);
    case 'mageTower': return createMageTower(context);
    case 'market': return createMarket(context);
    case 'hospital': return createHospital(context);
    case 'home': return createHome(context);
  }
}

export function createAuxiliaryHouse(index: number, context: MedievalBuildingContext): MedievalBuildingModel {
  const root = createObjectGroup(`auxiliary-house-${index}`);
  const variants = [
    { width: 4.1, depth: 3.7, height: 2.55, roofHeight: 1.45, roof: context.materials.roofTerracotta, timber: true },
    { width: 3.7, depth: 3.45, height: 2.35, roofHeight: 1.3, roof: context.materials.roofMoss, timber: false },
    { width: 4.5, depth: 3.9, height: 2.75, roofHeight: 1.55, roof: context.materials.thatch, timber: true },
  ] as const;
  const variant = variants[index % variants.length];
  addHouseShell(root, context, {
    width: variant.width,
    depth: variant.depth,
    wallHeight: variant.height,
    roofHeight: variant.roofHeight,
    wall: index % 4 === 0 ? context.materials.stone : context.materials.plaster,
    roof: variant.roof,
    timberFrame: variant.timber,
    frontWindows: 2,
    sideWindows: index % 2 === 0,
    doorOffset: index % 2 === 0 ? -0.55 : 0.55,
  });
  if (index % 3 !== 1) addChimney(root, context, [variant.width * 0.28, variant.height, -0.45], 1.6);
  if (index % 3 === 0) addBarrel(root, context, -variant.width / 2 - 0.55, variant.depth / 2 - 0.35, 0.72);
  return {
    root,
    localColliderBoxes: [localBox(variant.width + 0.5, variant.depth + 0.5, variant.height + variant.roofHeight + 0.5)],
    interactionOffset: new THREE.Vector3(0, 0, variant.depth / 2 + 1.25),
    animations: [],
  };
}

export function createDistantCastle(context: MedievalBuildingContext): THREE.Group {
  const root = createObjectGroup('far-layer-distant-castle');
  const wall = context.materials.stoneDark;
  addBox(root, context.geometries.box, wall, 'castle-keep', [7, 6.5, 4.8], [0, 3.25, 0], { castShadow: true });
  addBox(root, context.geometries.box, context.materials.roofSlate, 'castle-keep-roof', [7.6, 0.65, 5.4], [0, 6.65, 0]);
  for (const x of [-4.1, 4.1]) {
    for (const z of [-2.55, 2.55]) {
      addPrimitive(root, context.geometries.cylinder8, wall, 'castle-tower', [3.2, 7.8, 3.2], [x, 3.9, z], { castShadow: true });
      addPrimitive(root, context.geometries.cone8, context.materials.roofSlate, 'castle-tower-roof', [4.1, 2.8, 4.1], [x, 9.15, z]);
    }
  }
  addBox(root, context.geometries.box, wall, 'castle-wall-left', [5.2, 3.8, 0.95], [-3.2, 1.9, 3.35]);
  addBox(root, context.geometries.box, wall, 'castle-wall-right', [5.2, 3.8, 0.95], [3.2, 1.9, 3.35]);
  addBox(root, context.geometries.box, context.materials.decalDark, 'castle-gate', [1.9, 2.8, 0.3], [0, 1.4, 3.86]);
  for (const x of [-2.25, 0, 2.25]) {
    addBox(root, context.geometries.box, context.materials.windowWarm, 'castle-window', [0.4, 0.7, 0.16], [x, 4.2, 2.5]);
  }
  const flag = addBanner(root, context, 'castle-flag', 0, 8.2, 0, context.materials.hazard);
  flag.scale.setScalar(0.75);
  return root;
}
