import * as THREE from 'three';

export interface MedievalGeometryLibrary {
  readonly box: THREE.BoxGeometry;
  readonly plane: THREE.PlaneGeometry;
  readonly cylinder4: THREE.CylinderGeometry;
  readonly cylinder6: THREE.CylinderGeometry;
  readonly cylinder8: THREE.CylinderGeometry;
  readonly cone4: THREE.ConeGeometry;
  readonly cone6: THREE.ConeGeometry;
  readonly cone8: THREE.ConeGeometry;
  readonly sphere6: THREE.SphereGeometry;
  readonly sphere8: THREE.SphereGeometry;
  readonly gableRoof: THREE.BufferGeometry;
  readonly ring12: THREE.RingGeometry;
  readonly torus8: THREE.TorusGeometry;
  readonly all: readonly THREE.BufferGeometry[];
}

export interface MeshOptions {
  castShadow?: boolean;
  receiveShadow?: boolean;
  rotation?: readonly [number, number, number];
}

export interface StaticBatchStats {
  readonly sourceMeshes: number;
  readonly batchedMeshes: number;
  readonly instances: number;
}

function createGableRoofGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array([
    // Front gable (+z)
    -0.5, 0, 0.5, 0.5, 0, 0.5, 0, 0.5, 0.5,
    // Back gable (-z)
    0.5, 0, -0.5, -0.5, 0, -0.5, 0, 0.5, -0.5,
    // Left slope
    -0.5, 0, -0.5, -0.5, 0, 0.5, 0, 0.5, 0.5,
    -0.5, 0, -0.5, 0, 0.5, 0.5, 0, 0.5, -0.5,
    // Right slope
    0.5, 0, 0.5, 0.5, 0, -0.5, 0, 0.5, -0.5,
    0.5, 0, 0.5, 0, 0.5, -0.5, 0, 0.5, 0.5,
    // Eave underside
    -0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, 0.5,
    -0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5,
  ]);
  const uvs = new Float32Array([
    0, 0, 1, 0, 0.5, 1,
    0, 0, 1, 0, 0.5, 1,
    0, 0, 1, 0, 1, 1,
    0, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1,
    0, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1,
    0, 0, 1, 1, 0, 1,
  ]);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.name = 'geo-unit-gable-roof';
  return geometry;
}

export function createMedievalGeometryLibrary(): MedievalGeometryLibrary {
  const box = new THREE.BoxGeometry(1, 1, 1);
  box.name = 'geo-unit-box';
  const plane = new THREE.PlaneGeometry(1, 1);
  plane.name = 'geo-unit-plane';
  const cylinder4 = new THREE.CylinderGeometry(0.5, 0.5, 1, 4, 1, false);
  cylinder4.name = 'geo-unit-cylinder-4';
  const cylinder6 = new THREE.CylinderGeometry(0.5, 0.5, 1, 6, 1, false);
  cylinder6.name = 'geo-unit-cylinder-6';
  const cylinder8 = new THREE.CylinderGeometry(0.5, 0.5, 1, 8, 1, false);
  cylinder8.name = 'geo-unit-cylinder-8';
  const cone4 = new THREE.ConeGeometry(0.5, 1, 4, 1, false);
  cone4.name = 'geo-unit-cone-4';
  const cone6 = new THREE.ConeGeometry(0.5, 1, 6, 1, false);
  cone6.name = 'geo-unit-cone-6';
  const cone8 = new THREE.ConeGeometry(0.5, 1, 8, 1, false);
  cone8.name = 'geo-unit-cone-8';
  const sphere6 = new THREE.SphereGeometry(0.5, 6, 4);
  sphere6.name = 'geo-unit-sphere-6';
  const sphere8 = new THREE.SphereGeometry(0.5, 8, 5);
  sphere8.name = 'geo-unit-sphere-8';
  const gableRoof = createGableRoofGeometry();
  const ring12 = new THREE.RingGeometry(0.37, 0.5, 12);
  ring12.name = 'geo-unit-ring-12';
  const torus8 = new THREE.TorusGeometry(0.5, 0.11, 4, 8);
  torus8.name = 'geo-unit-torus-8';
  const all = [
    box,
    plane,
    cylinder4,
    cylinder6,
    cylinder8,
    cone4,
    cone6,
    cone8,
    sphere6,
    sphere8,
    gableRoof,
    ring12,
    torus8,
  ] as const;
  return {
    box,
    plane,
    cylinder4,
    cylinder6,
    cylinder8,
    cone4,
    cone6,
    cone8,
    sphere6,
    sphere8,
    gableRoof,
    ring12,
    torus8,
    all,
  };
}

export function disposeMedievalGeometryLibrary(library: MedievalGeometryLibrary): void {
  for (const geometry of new Set(library.all)) geometry.dispose();
}

function configureMesh(mesh: THREE.Mesh, options: MeshOptions): THREE.Mesh {
  mesh.castShadow = options.castShadow ?? false;
  mesh.receiveShadow = options.receiveShadow ?? false;
  if (options.rotation) mesh.rotation.set(...options.rotation);
  return mesh;
}

export function addBox(
  parent: THREE.Object3D,
  geometry: THREE.BoxGeometry,
  material: THREE.Material,
  name: string,
  size: readonly [number, number, number],
  position: readonly [number, number, number],
  options: MeshOptions = {},
): THREE.Mesh {
  const mesh = configureMesh(new THREE.Mesh(geometry, material), options);
  mesh.name = name;
  mesh.scale.set(...size);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

export function addPrimitive(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  name: string,
  size: readonly [number, number, number],
  position: readonly [number, number, number],
  options: MeshOptions = {},
): THREE.Mesh {
  const mesh = configureMesh(new THREE.Mesh(geometry, material), options);
  mesh.name = name;
  mesh.scale.set(...size);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

export function addGableRoof(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  name: string,
  size: readonly [number, number, number],
  position: readonly [number, number, number],
  options: MeshOptions = {},
): THREE.Mesh {
  return addPrimitive(parent, geometry, material, name, size, position, options);
}

export function createObjectGroup(name: string): THREE.Group {
  const group = new THREE.Group();
  group.name = name;
  return group;
}

function hasDynamicAncestor(object: THREE.Object3D, boundary: THREE.Object3D): boolean {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current.userData.dynamic === true) return true;
    if (current === boundary) return false;
    current = current.parent;
  }
  return false;
}

/**
 * Converts repeated static meshes inside one visual layer to InstancedMesh.
 * Named parent groups remain available for scene inspection; original mesh
 * names are retained in `userData.instanceNames` on each generated batch.
 */
export function batchStaticMeshes(root: THREE.Group, namePrefix: string): StaticBatchStats {
  root.updateWorldMatrix(true, true);
  const groups = new Map<string, THREE.Mesh[]>();
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh || mesh instanceof THREE.InstancedMesh || hasDynamicAncestor(mesh, root)) return;
    if (Array.isArray(mesh.material)) return;
    const key = [
      mesh.geometry.uuid,
      mesh.material.uuid,
      mesh.castShadow ? 'cast' : 'no-cast',
      mesh.receiveShadow ? 'receive' : 'no-receive',
    ].join(':');
    const bucket = groups.get(key);
    if (bucket) bucket.push(mesh);
    else groups.set(key, [mesh]);
  });

  const inverseRoot = root.matrixWorld.clone().invert();
  const localMatrix = new THREE.Matrix4();
  let sourceMeshes = 0;
  let batchedMeshes = 0;
  let instances = 0;
  let batchIndex = 0;

  for (const meshes of groups.values()) {
    if (meshes.length < 2) continue;
    const first = meshes[0];
    const firstMaterial = first.material as THREE.Material;
    const batch = new THREE.InstancedMesh(first.geometry, firstMaterial, meshes.length);
    const materialName = firstMaterial.name || 'material';
    const geometryName = first.geometry.name || 'geometry';
    batch.name = `${namePrefix}-${batchIndex}-${materialName}-${geometryName}`;
    batch.castShadow = first.castShadow;
    batch.receiveShadow = first.receiveShadow;
    batch.userData.instanceNames = meshes.map((mesh) => mesh.name);
    meshes.forEach((mesh, index) => {
      localMatrix.multiplyMatrices(inverseRoot, mesh.matrixWorld);
      batch.setMatrixAt(index, localMatrix);
    });
    batch.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    batch.instanceMatrix.needsUpdate = true;
    batch.computeBoundingBox();
    batch.computeBoundingSphere();
    for (const mesh of meshes) mesh.removeFromParent();
    root.add(batch);
    sourceMeshes += meshes.length;
    instances += meshes.length;
    batchedMeshes += 1;
    batchIndex += 1;
  }

  return { sourceMeshes, batchedMeshes, instances };
}
