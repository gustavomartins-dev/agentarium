import * as THREE from 'three';

export type LandmarkId =
  | 'guild'
  | 'tavern'
  | 'forge'
  | 'library'
  | 'church'
  | 'mageTower'
  | 'market'
  | 'hospital'
  | 'home';

export type LandmarkAction =
  | 'create-project'
  | 'meet-agents'
  | 'open-code-tasks'
  | 'open-memory'
  | 'review-history'
  | 'open-ai-lab'
  | 'open-integrations'
  | 'open-diagnostics'
  | 'open-profile';

export interface VillageInteractionPoint {
  readonly id: string;
  readonly landmarkId: LandmarkId;
  readonly label: string;
  readonly description: string;
  readonly action: LandmarkAction;
  readonly position: THREE.Vector3;
  readonly radius: number;
}

export interface VillageCollider {
  readonly id: string;
  readonly landmarkId?: LandmarkId;
  readonly kind: 'aabb' | 'circle';
  readonly bounds?: THREE.Box3;
  readonly center?: THREE.Vector2;
  readonly radius?: number;
  readonly blocksMovement: boolean;
}

export interface VillageLandmark {
  readonly id: LandmarkId;
  readonly label: string;
  readonly purpose: string;
  readonly root: THREE.Group;
  readonly bounds: THREE.Box3;
  readonly interaction: VillageInteractionPoint;
  readonly colliders: readonly VillageCollider[];
}

export interface VillageDiagnostics {
  readonly meshes: number;
  readonly instancedMeshes: number;
  readonly instances: number;
  readonly geometries: number;
  readonly materials: number;
  readonly textures: number;
  readonly approximateTriangles: number;
  readonly colliders: number;
  readonly interactionPoints: number;
}

export interface MedievalVillageWorld {
  readonly root: THREE.Group;
  readonly landmarks: ReadonlyMap<LandmarkId, VillageLandmark>;
  readonly interactionPoints: readonly VillageInteractionPoint[];
  readonly colliders: readonly VillageCollider[];
  readonly bounds: THREE.Box3;
  readonly spawnPoint: THREE.Vector3;
  readonly diagnostics: VillageDiagnostics;
  findClosestInteraction(position: THREE.Vector3, maxDistance?: number): VillageInteractionPoint | null;
  update(elapsedSeconds: number): void;
  dispose(): void;
}
