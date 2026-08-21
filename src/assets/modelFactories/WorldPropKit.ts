import * as THREE from 'three';
import type { VillageCollider } from '../../world/VillageTypes';
import {
  addBox,
  addPrimitive,
  createObjectGroup,
} from './MedievalModelKit';
import type { MedievalBuildingContext } from './MedievalBuildingFactory';

export interface WorldPropKitResult {
  readonly root: THREE.Group;
  readonly colliders: readonly VillageCollider[];
  readonly animations: readonly ((elapsedSeconds: number) => void)[];
}

type Placement = readonly [x: number, z: number, scale: number, rotation?: number];

const TREE_PLACEMENTS: readonly Placement[] = [
  [-37, -27, 1.25], [-32, -29, 0.95], [-27, -28, 1.1], [-17, -30, 0.9], [-9, -29, 1.15],
  [8, -30, 1.05], [17, -29, 1.25], [28, -28, 0.9], [35, -25, 1.15], [38, -17, 1],
  [39, -7, 1.25], [37, 3, 0.9], [38, 14, 1.1], [35, 25, 1.25], [29, 30, 0.92],
  [21, 31, 1.08], [10, 31, 0.9], [-7, 32, 1.2], [-17, 31, 0.96], [-27, 30, 1.1],
  [-36, 26, 1.22], [-39, 17, 0.94], [-38, 8, 1.05], [-39, -3, 1.18], [-38, -15, 0.9],
  [-29, -1, 0.82], [-30, 12, 0.92], [-24, 24, 0.78], [26, 23, 0.86], [30, 11, 0.78],
  [20, -24, 0.86], [-17, -17, 0.8], [31, -17, 0.88], [-11, 25, 0.76],
];

const BUSH_PLACEMENTS: readonly Placement[] = [
  [-8, 10, 0.8], [-7, 11, 0.62], [-17, 9, 0.7], [-19, 10, 0.8], [11, 15, 0.72],
  [12, 16, 0.62], [24, 11, 0.74], [25, 12, 0.6], [-27, 18, 0.84], [-29, 19, 0.66],
  [8, -19, 0.75], [10, -20, 0.6], [-10, -11, 0.72], [-12, -12, 0.62], [31, -9, 0.72],
];

const GRASS_PLACEMENTS: readonly Placement[] = Array.from({ length: 76 }, (_, index) => {
  const angle = index * 2.399963;
  const radius = 12 + (index % 9) * 2.85;
  const x = Math.cos(angle) * radius + Math.sin(index * 1.73) * 2;
  const z = Math.sin(angle) * radius * 0.76 + Math.cos(index * 0.91) * 3;
  return [x, z, 0.55 + (index % 4) * 0.11, angle] as const;
});

function setInstance(
  mesh: THREE.InstancedMesh,
  index: number,
  placement: Placement,
  y: number,
  scale: readonly [number, number, number],
  rotationOffset = 0,
): void {
  const [x, z, placementScale, rotation = 0] = placement;
  const dummy = new THREE.Object3D();
  dummy.position.set(x, y * placementScale, z);
  dummy.scale.set(scale[0] * placementScale, scale[1] * placementScale, scale[2] * placementScale);
  dummy.rotation.y = rotation + rotationOffset;
  dummy.updateMatrix();
  mesh.setMatrixAt(index, dummy.matrix);
}

function finishInstances(mesh: THREE.InstancedMesh): void {
  mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingBox();
  mesh.computeBoundingSphere();
}

function createVegetation(context: MedievalBuildingContext): THREE.Group {
  const root = createObjectGroup('near-mid-layer-vegetation');
  const trunks = new THREE.InstancedMesh(
    context.geometries.cylinder6,
    context.materials.timberDark,
    TREE_PLACEMENTS.length,
  );
  trunks.name = 'instanced-tree-trunks';
  const lowerCanopies = new THREE.InstancedMesh(
    context.geometries.cone6,
    context.materials.foliageDark,
    TREE_PLACEMENTS.length,
  );
  lowerCanopies.name = 'instanced-tree-lower-canopies';
  const middleCanopies = new THREE.InstancedMesh(
    context.geometries.cone6,
    context.materials.foliageMid,
    TREE_PLACEMENTS.length,
  );
  middleCanopies.name = 'instanced-tree-middle-canopies';
  const topCanopies = new THREE.InstancedMesh(
    context.geometries.cone6,
    context.materials.foliageLight,
    TREE_PLACEMENTS.length,
  );
  topCanopies.name = 'instanced-tree-top-canopies';

  TREE_PLACEMENTS.forEach((placement, index) => {
    setInstance(trunks, index, placement, 1.4, [0.62, 2.8, 0.62]);
    setInstance(lowerCanopies, index, placement, 3.15, [3.25, 3, 3.25], index * 0.31);
    setInstance(middleCanopies, index, placement, 4.3, [2.65, 2.65, 2.65], index * -0.23);
    setInstance(topCanopies, index, placement, 5.2, [1.75, 2.1, 1.75], index * 0.17);
  });
  [trunks, lowerCanopies, middleCanopies, topCanopies].forEach((mesh) => {
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    finishInstances(mesh);
    root.add(mesh);
  });

  const bushes = new THREE.InstancedMesh(
    context.geometries.sphere6,
    context.materials.foliageMid,
    BUSH_PLACEMENTS.length,
  );
  bushes.name = 'instanced-bushes';
  BUSH_PLACEMENTS.forEach((placement, index) => {
    setInstance(bushes, index, placement, 0.58, [1.5, 1.15, 1.25], index * 0.5);
  });
  finishInstances(bushes);
  root.add(bushes);

  const grassTufts = new THREE.InstancedMesh(
    context.geometries.cone4,
    context.materials.foliageLight,
    GRASS_PLACEMENTS.length,
  );
  grassTufts.name = 'instanced-grass-tufts';
  GRASS_PLACEMENTS.forEach((placement, index) => {
    setInstance(grassTufts, index, placement, 0.35, [0.44, 0.7, 0.44], index * 0.79);
  });
  finishInstances(grassTufts);
  root.add(grassTufts);
  return root;
}

function createFountain(context: MedievalBuildingContext): { root: THREE.Group; collider: VillageCollider } {
  const root = createObjectGroup('village-square-fountain');
  root.position.set(0, 0, 4);
  addPrimitive(root, context.geometries.cylinder8, context.materials.stoneDark, 'fountain-base', [4.2, 0.45, 4.2], [0, 0.23, 0], { receiveShadow: true });
  addPrimitive(root, context.geometries.cylinder8, context.materials.stone, 'fountain-basin-rim', [3.6, 0.55, 3.6], [0, 0.5, 0], { receiveShadow: true });
  addPrimitive(root, context.geometries.cylinder8, context.materials.water, 'fountain-water', [3.05, 0.08, 3.05], [0, 0.79, 0]);
  addPrimitive(root, context.geometries.cylinder8, context.materials.stone, 'fountain-column', [0.72, 2.2, 0.72], [0, 1.58, 0], { castShadow: true });
  addPrimitive(root, context.geometries.sphere8, context.materials.water, 'fountain-water-crown', [0.82, 0.44, 0.82], [0, 2.85, 0]);
  return {
    root,
    collider: {
      id: 'prop-fountain',
      kind: 'circle',
      center: new THREE.Vector2(0, 4),
      radius: 2.15,
      blocksMovement: true,
    },
  };
}

function createBenches(context: MedievalBuildingContext): THREE.Group {
  const root = createObjectGroup('village-square-benches');
  const placements = [
    [-4.4, 1.6, Math.PI / 2],
    [4.4, 6.4, -Math.PI / 2],
    [-4.4, 6.4, Math.PI / 2],
    [4.4, 1.6, -Math.PI / 2],
  ] as const;
  placements.forEach(([x, z, rotation], index) => {
    const bench = createObjectGroup(`bench-${index}`);
    bench.position.set(x, 0, z);
    bench.rotation.y = rotation;
    addBox(bench, context.geometries.box, context.materials.woodLight, 'bench-seat', [2.25, 0.18, 0.62], [0, 0.68, 0]);
    addBox(bench, context.geometries.box, context.materials.woodLight, 'bench-back', [2.25, 0.72, 0.16], [0, 1, -0.28], { rotation: [-0.12, 0, 0] });
    for (const footX of [-0.82, 0.82]) {
      addBox(bench, context.geometries.box, context.materials.iron, 'bench-leg', [0.15, 0.68, 0.48], [footX, 0.34, 0]);
    }
    root.add(bench);
  });
  return root;
}

function createLanterns(context: MedievalBuildingContext): { root: THREE.Group; animations: ((elapsed: number) => void)[] } {
  const root = createObjectGroup('village-lanterns');
  const lights: THREE.Mesh[] = [];
  const placements = [
    [-6, 10], [6, 10], [-6, -2], [6, -2], [-15, 7], [15, 7], [-15, -7], [15, -7],
  ] as const;
  placements.forEach(([x, z], index) => {
    const lantern = createObjectGroup(`lantern-${index}`);
    lantern.position.set(x, 0, z);
    addPrimitive(lantern, context.geometries.cylinder6, context.materials.iron, 'lantern-post', [0.18, 3.2, 0.18], [0, 1.6, 0]);
    addBox(lantern, context.geometries.box, context.materials.iron, 'lantern-arm', [0.75, 0.12, 0.12], [0.28, 3.02, 0]);
    const light = addPrimitive(lantern, context.geometries.sphere6, context.materials.emissiveSignal, 'lantern-light', [0.38, 0.56, 0.38], [0.62, 2.72, 0]);
    light.userData.dynamic = true;
    lights.push(light);
    addPrimitive(lantern, context.geometries.cone4, context.materials.iron, 'lantern-cap', [0.72, 0.42, 0.72], [0.62, 3.12, 0], { rotation: [0, Math.PI / 4, 0] });
    root.add(lantern);
  });
  return {
    root,
    animations: [(elapsed) => {
      lights.forEach((light, index) => {
        const pulse = 0.96 + Math.sin(elapsed * 3.2 + index * 1.71) * 0.04;
        light.scale.set(0.38 * pulse, 0.56 * pulse, 0.38 * pulse);
      });
    }],
  };
}

function createCart(context: MedievalBuildingContext): { root: THREE.Group; colliders: VillageCollider[] } {
  const root = createObjectGroup('market-supply-cart');
  root.position.set(-7.2, 0, 6.9);
  root.rotation.y = -0.38;
  addBox(root, context.geometries.box, context.materials.woodLight, 'cart-bed', [3.15, 0.5, 1.65], [0, 1.02, 0], { castShadow: true });
  addBox(root, context.geometries.box, context.materials.timberDark, 'cart-left-rail', [3.2, 0.72, 0.14], [0, 1.5, -0.76]);
  addBox(root, context.geometries.box, context.materials.timberDark, 'cart-right-rail', [3.2, 0.72, 0.14], [0, 1.5, 0.76]);
  addBox(root, context.geometries.box, context.materials.timberDark, 'cart-shaft-left', [2.8, 0.14, 0.14], [2.75, 0.68, -0.55], { rotation: [0, -0.1, 0] });
  addBox(root, context.geometries.box, context.materials.timberDark, 'cart-shaft-right', [2.8, 0.14, 0.14], [2.75, 0.68, 0.55], { rotation: [0, 0.1, 0] });
  for (const x of [-1.05, 1.05]) {
    for (const z of [-0.92, 0.92]) {
      addPrimitive(root, context.geometries.torus8, context.materials.timberDark, 'cart-wheel', [0.9, 0.9, 0.38], [x, 0.72, z], { rotation: [Math.PI / 2, 0, 0] });
    }
  }
  const bounds = new THREE.Box3(new THREE.Vector3(-9.2, 0, 5.7), new THREE.Vector3(-4.2, 2, 8.1));
  return {
    root,
    colliders: [{ id: 'prop-market-cart', kind: 'aabb', bounds, blocksMovement: true }],
  };
}

function createFarmPatches(context: MedievalBuildingContext): THREE.Group {
  const root = createObjectGroup('village-gardens');
  const patchData = [
    [20.5, 20.8, 4.8, 3.6],
    [23.8, 13.5, 5.2, 3.2],
  ] as const;
  patchData.forEach(([x, z, width, depth], patchIndex) => {
    addBox(root, context.geometries.box, context.materials.soil, `garden-soil-${patchIndex}`, [width, 0.12, depth], [x, 0.06, z], { receiveShadow: true });
    const cropCount = 12;
    const crops = new THREE.InstancedMesh(context.geometries.cone4, context.materials.foliageLight, cropCount);
    crops.name = `instanced-garden-crops-${patchIndex}`;
    for (let index = 0; index < cropCount; index += 1) {
      const row = Math.floor(index / 4);
      const column = index % 4;
      const placement: Placement = [x - width * 0.32 + column * (width * 0.21), z - depth * 0.26 + row * (depth * 0.26), 0.68, index * 0.6];
      setInstance(crops, index, placement, 0.4, [0.38, 0.8, 0.38]);
    }
    finishInstances(crops);
    root.add(crops);
  });
  return root;
}

function createFenceRows(context: MedievalBuildingContext): THREE.Group {
  const root = createObjectGroup('instanced-village-fences');
  const segments: Placement[] = [];
  for (let index = 0; index < 8; index += 1) {
    segments.push([11 + index * 1.5, 26.5, 1, 0]);
    segments.push([27.5, 15 + index * 1.5, 1, Math.PI / 2]);
  }
  for (let index = 0; index < 7; index += 1) {
    segments.push([-25 + index * 1.5, 23.5, 1, 0]);
  }

  const posts = new THREE.InstancedMesh(context.geometries.box, context.materials.timberDark, segments.length * 2);
  posts.name = 'instanced-fence-posts';
  const rails = new THREE.InstancedMesh(context.geometries.box, context.materials.woodLight, segments.length * 2);
  rails.name = 'instanced-fence-rails';
  const dummy = new THREE.Object3D();
  segments.forEach(([x, z, , rotation], segmentIndex) => {
    for (let edge = 0; edge < 2; edge += 1) {
      const offset = edge === 0 ? -0.72 : 0.72;
      dummy.position.set(x + Math.cos(rotation ?? 0) * offset, 0.62, z - Math.sin(rotation ?? 0) * offset);
      dummy.rotation.y = rotation ?? 0;
      dummy.scale.set(0.16, 1.24, 0.16);
      dummy.updateMatrix();
      posts.setMatrixAt(segmentIndex * 2 + edge, dummy.matrix);

      dummy.position.set(x, edge === 0 ? 0.52 : 0.93, z);
      dummy.rotation.y = rotation ?? 0;
      dummy.scale.set(1.55, 0.13, 0.13);
      dummy.updateMatrix();
      rails.setMatrixAt(segmentIndex * 2 + edge, dummy.matrix);
    }
  });
  finishInstances(posts);
  finishInstances(rails);
  root.add(posts, rails);
  return root;
}

function createRockScatter(context: MedievalBuildingContext): THREE.Group {
  const root = createObjectGroup('instanced-rock-scatter');
  const placements: readonly Placement[] = [
    [-34, -20, 1.2, 0.2], [-31, -22, 0.7, 0.8], [34, -20, 0.9, 1.1], [35, -11, 0.65, 0.2],
    [-34, 12, 0.72, 1.5], [31, 27, 1.05, 0.6], [-21, 29, 0.68, 1.2], [19, -28, 0.8, 0.4],
  ];
  const rocks = new THREE.InstancedMesh(context.geometries.sphere6, context.materials.stoneDark, placements.length);
  rocks.name = 'instanced-faceted-rocks';
  placements.forEach((placement, index) => {
    setInstance(rocks, index, placement, 0.48, [1.35, 0.88, 1.1], index * 0.73);
  });
  finishInstances(rocks);
  root.add(rocks);
  return root;
}

export function createWorldPropKit(context: MedievalBuildingContext): WorldPropKitResult {
  const root = createObjectGroup('village-prop-kit');
  const colliders: VillageCollider[] = [];
  const animations: ((elapsedSeconds: number) => void)[] = [];

  root.add(createVegetation(context));
  const fountain = createFountain(context);
  root.add(fountain.root);
  colliders.push(fountain.collider);
  root.add(createBenches(context));
  const lanterns = createLanterns(context);
  root.add(lanterns.root);
  animations.push(...lanterns.animations);
  const cart = createCart(context);
  root.add(cart.root);
  colliders.push(...cart.colliders);
  root.add(createFarmPatches(context));
  root.add(createFenceRows(context));
  root.add(createRockScatter(context));

  return { root, colliders, animations };
}
