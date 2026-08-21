import * as THREE from 'three';
import {
  createMedievalMaterialLibrary,
  disposeMedievalMaterialLibrary,
} from '../assets/MaterialLibrary';
import {
  createAuxiliaryHouse,
  createDistantCastle,
  createLandmarkBuilding,
  type MedievalBuildingContext,
} from '../assets/modelFactories/MedievalBuildingFactory';
import {
  addBox,
  addPrimitive,
  batchStaticMeshes,
  createMedievalGeometryLibrary,
  createObjectGroup,
  disposeMedievalGeometryLibrary,
} from '../assets/modelFactories/MedievalModelKit';
import { createWorldPropKit } from '../assets/modelFactories/WorldPropKit';
import type {
  LandmarkAction,
  LandmarkId,
  MedievalVillageWorld,
  VillageCollider,
  VillageDiagnostics,
  VillageInteractionPoint,
  VillageLandmark,
} from './VillageTypes';

export interface BuildMedievalVillageOptions {
  readonly showInteractionMarkers?: boolean;
  readonly includeDistantCastle?: boolean;
}

interface LandmarkPlacement {
  readonly id: LandmarkId;
  readonly label: string;
  readonly purpose: string;
  readonly action: LandmarkAction;
  readonly position: readonly [number, number, number];
  readonly rotation: number;
  readonly interactionRadius: number;
}

interface AuxiliaryPlacement {
  readonly position: readonly [number, number, number];
  readonly rotation: number;
}

const LANDMARK_PLACEMENTS: readonly LandmarkPlacement[] = [
  {
    id: 'guild',
    label: 'Guilda',
    purpose: 'Criar projetos e receber missões.',
    action: 'create-project',
    position: [0, 0, -13],
    rotation: 0,
    interactionRadius: 2.4,
  },
  {
    id: 'tavern',
    label: 'Taverna',
    purpose: 'Encontrar, selecionar e conversar com agentes.',
    action: 'meet-agents',
    position: [-14.5, 0, 1.5],
    rotation: Math.PI / 2,
    interactionRadius: 2.35,
  },
  {
    id: 'forge',
    label: 'Ferraria',
    purpose: 'Acompanhar agentes executores e tarefas de código.',
    action: 'open-code-tasks',
    position: [-24, 0, -10.5],
    rotation: Math.PI / 2,
    interactionRadius: 2.45,
  },
  {
    id: 'library',
    label: 'Biblioteca',
    purpose: 'Consultar memória, documentação e conceitos aprendidos.',
    action: 'open-memory',
    position: [13.5, 0, -15],
    rotation: -0.58,
    interactionRadius: 2.35,
  },
  {
    id: 'church',
    label: 'Igreja',
    purpose: 'Refletir, revisar decisões e consultar o histórico.',
    action: 'review-history',
    position: [25, 0, -4],
    rotation: -Math.PI / 2,
    interactionRadius: 2.6,
  },
  {
    id: 'mageTower',
    label: 'Torre do Mago',
    purpose: 'Experimentar modelos de IA, prompts e configurações.',
    action: 'open-ai-lab',
    position: [-28, 0, -22],
    rotation: 0.72,
    interactionRadius: 2.55,
  },
  {
    id: 'market',
    label: 'Mercado',
    purpose: 'Descobrir ferramentas e integrações futuras.',
    action: 'open-integrations',
    position: [-8, 0, 5],
    rotation: 0,
    interactionRadius: 2.8,
  },
  {
    id: 'hospital',
    label: 'Hospital',
    purpose: 'Investigar erros, recuperação e diagnóstico.',
    action: 'open-diagnostics',
    position: [19, 0, 9],
    rotation: -Math.PI / 2,
    interactionRadius: 2.35,
  },
  {
    id: 'home',
    label: 'Sua Casa',
    purpose: 'Abrir configurações, progresso e diário pessoal.',
    action: 'open-profile',
    position: [14, 0, 23],
    rotation: Math.PI,
    interactionRadius: 2.25,
  },
];

const AUXILIARY_PLACEMENTS: readonly AuxiliaryPlacement[] = [
  { position: [-8, 0, 20], rotation: Math.PI },
  { position: [-19, 0, 18], rotation: 2.45 },
  { position: [-29.5, 0, 8], rotation: Math.PI / 2 },
  { position: [-33, 0, -7], rotation: Math.PI / 2 },
  { position: [-14, 0, -23], rotation: 0.42 },
  { position: [1.5, 0, -25.5], rotation: 0 },
  { position: [18, 0, -25], rotation: -0.5 },
  { position: [31, 0, -18], rotation: -Math.PI / 2 },
  { position: [31, 0, 16], rotation: -Math.PI / 2 },
  { position: [3, 0, 27], rotation: Math.PI },
  { position: [-23.5, 0, 27], rotation: Math.PI },
];

function addPathBetween(
  parent: THREE.Object3D,
  context: MedievalBuildingContext,
  name: string,
  start: readonly [number, number],
  end: readonly [number, number],
  width: number,
): void {
  const deltaX = end[0] - start[0];
  const deltaZ = end[1] - start[1];
  const length = Math.hypot(deltaX, deltaZ);
  const rotation = Math.atan2(deltaX, deltaZ);
  addBox(
    parent,
    context.geometries.box,
    context.materials.cobble,
    name,
    [width, 0.1, length],
    [(start[0] + end[0]) / 2, 0.015, (start[1] + end[1]) / 2],
    { rotation: [0, rotation, 0], receiveShadow: true },
  );
  addBox(
    parent,
    context.geometries.box,
    context.materials.stoneDark,
    `${name}-edge-left`,
    [0.18, 0.13, length],
    [(start[0] + end[0]) / 2, 0.01, (start[1] + end[1]) / 2],
    { rotation: [0, rotation, 0], receiveShadow: true },
  ).translateX(-width / 2);
  addBox(
    parent,
    context.geometries.box,
    context.materials.stoneDark,
    `${name}-edge-right`,
    [0.18, 0.13, length],
    [(start[0] + end[0]) / 2, 0.01, (start[1] + end[1]) / 2],
    { rotation: [0, rotation, 0], receiveShadow: true },
  ).translateX(width / 2);
}

function createTerrain(context: MedievalBuildingContext): THREE.Group {
  const root = createObjectGroup('play-layer-village-terrain');
  addPrimitive(
    root,
    context.geometries.plane,
    context.materials.grass,
    'village-grass-ground',
    // Extend beyond the collision boundary so the isometric camera never sees
    // the square edge of the diorama while following the player near a gate.
    [120, 110, 1],
    [0, -0.08, 0],
    { rotation: [-Math.PI / 2, 0, 0], receiveShadow: true },
  );

  const darkPatches = [
    [-28, 18, 16, 11, -0.2],
    [28, -22, 18, 10, 0.35],
    [-30, -26, 17, 9, -0.4],
  ] as const;
  darkPatches.forEach(([x, z, width, depth, rotation], index) => {
    addPrimitive(
      root,
      context.geometries.plane,
      context.materials.grassDark,
      `dark-grass-patch-${index}`,
      [width, depth, 1],
      [x, -0.065, z],
      { rotation: [-Math.PI / 2, 0, rotation], receiveShadow: true },
    );
  });

  const paths = createObjectGroup('village-cobblestone-road-network');
  addBox(paths, context.geometries.box, context.materials.cobble, 'central-square', [15.5, 0.1, 14.5], [0, 0.02, 4], { receiveShadow: true });
  addPathBetween(paths, context, 'south-gate-road', [0, 34], [0, 10], 4.5);
  addPathBetween(paths, context, 'guild-road', [0, -3], [0, -10], 4.4);
  addPathBetween(paths, context, 'western-road', [-5, 3], [-22, -7], 3.6);
  addPathBetween(paths, context, 'tavern-road', [-5, 5], [-12, 2.5], 3.35);
  addPathBetween(paths, context, 'mage-road', [-16, -8], [-26, -19], 3.25);
  addPathBetween(paths, context, 'library-road', [5, -2], [12, -12], 3.35);
  addPathBetween(paths, context, 'church-road', [6, 2], [22, -3], 3.5);
  addPathBetween(paths, context, 'hospital-road', [6, 7], [17, 8], 3.35);
  addPathBetween(paths, context, 'home-road', [5, 10], [14, 20], 3.2);
  addPathBetween(paths, context, 'northwest-lane', [-7, 10], [-19, 18], 2.6);
  addPathBetween(paths, context, 'northeast-lane', [7, 10], [29, 16], 2.6);
  root.add(paths);
  return root;
}

function createFarLayer(context: MedievalBuildingContext, includeCastle: boolean): THREE.Group {
  const root = createObjectGroup('far-layer-landscape');
  const hills = [
    [-24, 4.2, -59, 23, 9, 15],
    [20, 3.4, -62, 26, 8, 16],
    [0, 3.1, -66, 31, 7, 13],
  ] as const;
  hills.forEach(([x, y, z, width, height, depth], index) => {
    addPrimitive(
      root,
      context.geometries.cone8,
      index === 1 ? context.materials.foliageDark : context.materials.grassDark,
      `distant-hill-${index}`,
      [width, height, depth],
      [x, y, z],
    );
  });
  if (includeCastle) {
    const castle = createDistantCastle(context);
    // Place the silhouette on the camera's north-west continuation so it
    // reads as a tiny destination beyond the village instead of living off
    // screen to the north-east.
    castle.position.set(-43, 0.5, -18);
    castle.scale.setScalar(0.24);
    // Keep the tiny silhouette as one inspectable landmark instead of merging
    // its pieces into village-wide batches with incompatible culling bounds.
    castle.userData.dynamic = true;
    root.add(castle);
  }
  return root;
}

function worldCollider(
  id: string,
  localBounds: THREE.Box3,
  object: THREE.Object3D,
  landmarkId?: LandmarkId,
): VillageCollider {
  object.updateWorldMatrix(true, false);
  return {
    id,
    landmarkId,
    kind: 'aabb',
    bounds: localBounds.clone().applyMatrix4(object.matrixWorld),
    blocksMovement: true,
  };
}

function createInteractionMarker(
  point: VillageInteractionPoint,
  context: MedievalBuildingContext,
): { root: THREE.Group; animation: (elapsed: number) => void } {
  const root = createObjectGroup(`interaction-marker-${point.landmarkId}`);
  root.userData.dynamic = true;
  root.position.copy(point.position);
  root.userData.interactionId = point.id;
  root.userData.landmarkId = point.landmarkId;
  const ring = addPrimitive(
    root,
    context.geometries.ring12,
    context.materials.accents[point.landmarkId],
    'interaction-ground-ring',
    [1.15, 1.15, 1.15],
    [0, 0.035, 0],
    { rotation: [-Math.PI / 2, 0, 0] },
  );
  const diamond = addPrimitive(
    root,
    context.geometries.cone4,
    context.materials.accents[point.landmarkId],
    'interaction-diamond',
    [0.34, 0.55, 0.34],
    [0, 1.15, 0],
    { rotation: [0, Math.PI / 4, 0] },
  );
  return {
    root,
    animation: (elapsed) => {
      ring.rotation.z = elapsed * 0.35;
      diamond.rotation.y = elapsed * 0.8;
      diamond.position.y = 1.15 + Math.sin(elapsed * 2 + point.position.x) * 0.1;
    },
  };
}

function collectDiagnostics(root: THREE.Object3D, colliders: number, interactionPoints: number): VillageDiagnostics {
  let meshes = 0;
  let instancedMeshes = 0;
  let instances = 0;
  let approximateTriangles = 0;
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();

  root.traverse((object) => {
    const candidate = object as THREE.Mesh;
    if (!candidate.isMesh) return;
    meshes += 1;
    geometries.add(candidate.geometry);
    const geometryTriangles = candidate.geometry.index
      ? candidate.geometry.index.count / 3
      : (candidate.geometry.getAttribute('position')?.count ?? 0) / 3;
    const multiplier = candidate instanceof THREE.InstancedMesh ? candidate.count : 1;
    approximateTriangles += geometryTriangles * multiplier;
    if (candidate instanceof THREE.InstancedMesh) {
      instancedMeshes += 1;
      instances += candidate.count;
    }

    const objectMaterials = Array.isArray(candidate.material) ? candidate.material : [candidate.material];
    for (const material of objectMaterials) {
      materials.add(material);
      for (const value of Object.values(material as unknown as Record<string, unknown>)) {
        if (value && typeof value === 'object' && (value as { isTexture?: boolean }).isTexture) {
          textures.add(value as THREE.Texture);
        }
      }
    }
  });

  return {
    meshes,
    instancedMeshes,
    instances,
    geometries: geometries.size,
    materials: materials.size,
    textures: textures.size,
    approximateTriangles: Math.round(approximateTriangles),
    colliders,
    interactionPoints,
  };
}

function createBoundaryColliders(): VillageCollider[] {
  return [
    { id: 'boundary-west', kind: 'aabb', bounds: new THREE.Box3(new THREE.Vector3(-43, -1, -35), new THREE.Vector3(-40, 5, 35)), blocksMovement: true },
    { id: 'boundary-east', kind: 'aabb', bounds: new THREE.Box3(new THREE.Vector3(40, -1, -35), new THREE.Vector3(43, 5, 35)), blocksMovement: true },
    { id: 'boundary-north', kind: 'aabb', bounds: new THREE.Box3(new THREE.Vector3(-43, -1, -37), new THREE.Vector3(43, 5, -34)), blocksMovement: true },
    { id: 'boundary-south', kind: 'aabb', bounds: new THREE.Box3(new THREE.Vector3(-43, -1, 34), new THREE.Vector3(43, 5, 37)), blocksMovement: true },
  ];
}

export function buildMedievalVillage(options: BuildMedievalVillageOptions = {}): MedievalVillageWorld {
  const showInteractionMarkers = options.showInteractionMarkers ?? true;
  const includeDistantCastle = options.includeDistantCastle ?? true;
  const materials = createMedievalMaterialLibrary();
  const geometries = createMedievalGeometryLibrary();
  const context: MedievalBuildingContext = { materials, geometries };
  const root = createObjectGroup('agentarium-medieval-village');
  const landmarks = new Map<LandmarkId, VillageLandmark>();
  const interactionPoints: VillageInteractionPoint[] = [];
  const colliders: VillageCollider[] = createBoundaryColliders();
  const animations: ((elapsedSeconds: number) => void)[] = [];

  const terrainLayer = createTerrain(context);
  root.add(terrainLayer);
  const landmarkLayer = createObjectGroup('mid-layer-landmarks');
  root.add(landmarkLayer);

  for (const placement of LANDMARK_PLACEMENTS) {
    const model = createLandmarkBuilding(placement.id, context);
    model.root.position.set(...placement.position);
    model.root.rotation.y = placement.rotation;
    model.root.userData.label = placement.label;
    model.root.userData.purpose = placement.purpose;
    landmarkLayer.add(model.root);
    model.root.updateWorldMatrix(true, true);

    const landmarkColliders = model.localColliderBoxes.map((box, index) =>
      worldCollider(`landmark-${placement.id}-${index}`, box, model.root, placement.id),
    );
    colliders.push(...landmarkColliders);

    const interactionPosition = model.interactionOffset.clone();
    model.root.localToWorld(interactionPosition);
    interactionPosition.y = 0.04;
    const interaction: VillageInteractionPoint = {
      id: `interaction-${placement.id}`,
      landmarkId: placement.id,
      label: placement.label,
      description: placement.purpose,
      action: placement.action,
      position: interactionPosition,
      radius: placement.interactionRadius,
    };
    interactionPoints.push(interaction);
    animations.push(...model.animations);
    const bounds = new THREE.Box3().setFromObject(model.root);
    landmarks.set(placement.id, {
      id: placement.id,
      label: placement.label,
      purpose: placement.purpose,
      root: model.root,
      bounds,
      interaction,
      colliders: landmarkColliders,
    });

    if (showInteractionMarkers) {
      const marker = createInteractionMarker(interaction, context);
      root.add(marker.root);
      animations.push(marker.animation);
    }
  }

  const houseLayer = createObjectGroup('mid-layer-auxiliary-houses');
  AUXILIARY_PLACEMENTS.forEach((placement, index) => {
    const model = createAuxiliaryHouse(index, context);
    model.root.position.set(...placement.position);
    model.root.rotation.y = placement.rotation;
    houseLayer.add(model.root);
    model.localColliderBoxes.forEach((box, colliderIndex) => {
      colliders.push(worldCollider(`auxiliary-house-${index}-${colliderIndex}`, box, model.root));
    });
    animations.push(...model.animations);
  });
  root.add(houseLayer);

  const props = createWorldPropKit(context);
  root.add(props.root);
  colliders.push(...props.colliders);
  animations.push(...props.animations);
  const farLayer = createFarLayer(context, includeDistantCastle);
  root.add(farLayer);
  // Batch across the whole authored world, not one visual layer at a time.
  // Dynamic signs, fires, water and interaction markers opt out explicitly.
  batchStaticMeshes(root, 'village-static-batch');
  root.updateMatrixWorld(true);

  const bounds = new THREE.Box3(
    new THREE.Vector3(-41, -0.2, -35),
    new THREE.Vector3(41, 13.5, 35),
  );
  // The south gate gives the player a clear silhouette and a readable first
  // choice: follow the road toward the plaza or turn toward their own home.
  const spawnPoint = new THREE.Vector3(0, 0, 29.5);
  const diagnostics = collectDiagnostics(root, colliders.length, interactionPoints.length);
  let disposed = false;

  return {
    root,
    landmarks,
    interactionPoints,
    colliders,
    bounds,
    spawnPoint,
    diagnostics,
    findClosestInteraction(position, maxDistance = Number.POSITIVE_INFINITY) {
      let closest: VillageInteractionPoint | null = null;
      let closestDistanceSq = Number.POSITIVE_INFINITY;
      for (const point of interactionPoints) {
        const dx = position.x - point.position.x;
        const dz = position.z - point.position.z;
        const distanceSq = dx * dx + dz * dz;
        const allowedDistance = Math.min(maxDistance, point.radius);
        if (distanceSq <= allowedDistance * allowedDistance && distanceSq < closestDistanceSq) {
          closest = point;
          closestDistanceSq = distanceSq;
        }
      }
      return closest;
    },
    update(elapsedSeconds) {
      if (disposed) return;
      materials.textures.water.offset.x = (elapsedSeconds * 0.018) % 1;
      materials.textures.water.offset.y = (elapsedSeconds * -0.012) % 1;
      for (const animation of animations) animation(elapsedSeconds);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      root.removeFromParent();
      disposeMedievalGeometryLibrary(geometries);
      disposeMedievalMaterialLibrary(materials);
      landmarks.clear();
      interactionPoints.length = 0;
      colliders.length = 0;
      animations.length = 0;
    },
  };
}

export const createMedievalVillage = buildMedievalVillage;

export type {
  LandmarkId,
  MedievalVillageWorld,
  VillageCollider,
  VillageInteractionPoint,
  VillageLandmark,
} from './VillageTypes';
