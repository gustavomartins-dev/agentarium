import * as THREE from 'three';

export type HalfExtentBounds = {
  halfWidth: number;
  halfDepth: number;
};

export type RectBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export type MovementBounds = HalfExtentBounds | RectBounds;

/** A lightweight, authored collision proxy for a building or prop. */
export type AabbCollider = {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  enabled?: boolean;
  label?: string;
};

export type Landmark = {
  id: string;
  label: string;
  position: Readonly<{ x: number; z: number }>;
  radius: number;
  kind?: string;
  metadata?: Readonly<Record<string, unknown>>;
};

export type LandmarkProximity = {
  landmark: Landmark;
  distance: number;
  distanceToEdge: number;
};

export type LandmarkProximityChange = {
  nearby: LandmarkProximity[];
  entered: Landmark[];
  exited: Landmark[];
};

export type MovementCollision = {
  collided: boolean;
  blockedX: boolean;
  blockedZ: boolean;
  hitBounds: boolean;
  obstacleIds: string[];
};

const COLLISION_EPSILON = 0.0001;

export function createAabbCollider(
  id: string,
  centerX: number,
  centerZ: number,
  halfWidth: number,
  halfDepth: number,
  label?: string,
): AabbCollider {
  return {
    id,
    label,
    minX: centerX - Math.abs(halfWidth),
    maxX: centerX + Math.abs(halfWidth),
    minZ: centerZ - Math.abs(halfDepth),
    maxZ: centerZ + Math.abs(halfDepth),
  };
}

export class CollisionSystem {
  private readonly obstacles: AabbCollider[] = [];
  private readonly landmarks: Landmark[] = [];
  private readonly nearbyIds = new Set<string>();
  private readonly planarTarget = new THREE.Vector3();
  private readonly boundsRect: RectBounds = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };

  readonly lastMovement: MovementCollision = {
    collided: false,
    blockedX: false,
    blockedZ: false,
    hitBounds: false,
    obstacleIds: [],
  };

  setObstacles(obstacles: readonly AabbCollider[]): void {
    this.obstacles.length = 0;
    for (const obstacle of obstacles) this.obstacles.push({ ...obstacle });
  }

  addObstacle(obstacle: AabbCollider): void {
    const index = this.obstacles.findIndex((candidate) => candidate.id === obstacle.id);
    const safeObstacle = { ...obstacle };
    if (index >= 0) this.obstacles[index] = safeObstacle;
    else this.obstacles.push(safeObstacle);
  }

  removeObstacle(id: string): boolean {
    const index = this.obstacles.findIndex((obstacle) => obstacle.id === id);
    if (index < 0) return false;
    this.obstacles.splice(index, 1);
    return true;
  }

  clearObstacles(): void {
    this.obstacles.length = 0;
  }

  getObstacles(): readonly AabbCollider[] {
    return this.obstacles;
  }

  /**
   * Moves a circle on the ground plane with axis sliding. Movement is split
   * into small steps so a low frame-rate dash cannot skip through a building.
   * The supplied target may be the same vector as position.
   */
  moveCircle(
    position: Readonly<THREE.Vector3>,
    displacement: Readonly<THREE.Vector3>,
    radius: number,
    bounds: MovementBounds,
    target: THREE.Vector3 = this.planarTarget,
  ): THREE.Vector3 {
    const safeRadius = Math.max(radius, 0.01);
    const rect = this.toInsetBounds(bounds, safeRadius);
    this.resetMovementResult();
    target.copy(position);
    const clampedX = THREE.MathUtils.clamp(target.x, rect.minX, rect.maxX);
    const clampedZ = THREE.MathUtils.clamp(target.z, rect.minZ, rect.maxZ);
    if (clampedX !== target.x || clampedZ !== target.z) {
      this.lastMovement.collided = true;
      this.lastMovement.hitBounds = true;
      this.lastMovement.blockedX = clampedX !== target.x;
      this.lastMovement.blockedZ = clampedZ !== target.z;
      target.x = clampedX;
      target.z = clampedZ;
    }
    this.resolveInitialPenetration(target, safeRadius, rect);

    const planarDistance = Math.hypot(displacement.x, displacement.z);
    const maxStep = Math.max(safeRadius * 0.45, 0.12);
    const steps = Math.max(1, Math.min(64, Math.ceil(planarDistance / maxStep)));
    const stepX = displacement.x / steps;
    const stepZ = displacement.z / steps;

    for (let step = 0; step < steps; step += 1) {
      this.moveAxis(target, stepX, safeRadius, rect, 'x');
      this.moveAxis(target, stepZ, safeRadius, rect, 'z');
    }

    // Movement is planar. Retain the caller's elevation for terrain/animation.
    target.y = position.y + displacement.y;
    return target;
  }

  setLandmarks(landmarks: readonly Landmark[]): void {
    this.landmarks.length = 0;
    this.landmarks.push(...landmarks);
    this.nearbyIds.clear();
  }

  addLandmark(landmark: Landmark): void {
    const index = this.landmarks.findIndex((candidate) => candidate.id === landmark.id);
    if (index >= 0) this.landmarks[index] = landmark;
    else this.landmarks.push(landmark);
  }

  removeLandmark(id: string): boolean {
    const index = this.landmarks.findIndex((landmark) => landmark.id === id);
    if (index < 0) return false;
    this.landmarks.splice(index, 1);
    this.nearbyIds.delete(id);
    return true;
  }

  getLandmarks(): readonly Landmark[] {
    return this.landmarks;
  }

  getNearbyLandmarks(
    position: Readonly<{ x: number; z: number }>,
    extraRadius = 0,
    target: LandmarkProximity[] = [],
  ): LandmarkProximity[] {
    target.length = 0;
    for (const landmark of this.landmarks) {
      const distance = Math.hypot(position.x - landmark.position.x, position.z - landmark.position.z);
      if (distance > Math.max(0, landmark.radius + extraRadius)) continue;
      target.push({
        landmark,
        distance,
        distanceToEdge: distance - landmark.radius,
      });
    }
    target.sort((a, b) => a.distance - b.distance);
    return target;
  }

  getNearestLandmark(
    position: Readonly<{ x: number; z: number }>,
    maxDistance = Number.POSITIVE_INFINITY,
  ): LandmarkProximity | null {
    let nearest: Landmark | null = null;
    let nearestDistance = maxDistance;
    for (const landmark of this.landmarks) {
      const distance = Math.hypot(position.x - landmark.position.x, position.z - landmark.position.z);
      if (distance >= nearestDistance) continue;
      nearest = landmark;
      nearestDistance = distance;
    }
    if (!nearest) return null;
    return {
      landmark: nearest,
      distance: nearestDistance,
      distanceToEdge: nearestDistance - nearest.radius,
    };
  }

  /** Tracks enter/exit edges while also returning sorted nearby landmarks. */
  updateLandmarkProximity(
    position: Readonly<{ x: number; z: number }>,
    extraRadius = 0,
  ): LandmarkProximityChange {
    const nearby = this.getNearbyLandmarks(position, extraRadius);
    const nextIds = new Set(nearby.map((item) => item.landmark.id));
    const entered = nearby
      .filter((item) => !this.nearbyIds.has(item.landmark.id))
      .map((item) => item.landmark);
    const exited = this.landmarks.filter(
      (landmark) => this.nearbyIds.has(landmark.id) && !nextIds.has(landmark.id),
    );

    this.nearbyIds.clear();
    for (const id of nextIds) this.nearbyIds.add(id);
    return { nearby, entered, exited };
  }

  private moveAxis(
    target: THREE.Vector3,
    amount: number,
    radius: number,
    bounds: RectBounds,
    axis: 'x' | 'z',
  ): void {
    if (Math.abs(amount) <= Number.EPSILON) return;
    const min = axis === 'x' ? bounds.minX : bounds.minZ;
    const max = axis === 'x' ? bounds.maxX : bounds.maxZ;
    const current = target[axis];
    const proposed = THREE.MathUtils.clamp(current + amount, min, max);
    if (proposed !== current + amount) {
      this.lastMovement.collided = true;
      this.lastMovement.hitBounds = true;
      if (axis === 'x') this.lastMovement.blockedX = true;
      else this.lastMovement.blockedZ = true;
    }

    const x = axis === 'x' ? proposed : target.x;
    const z = axis === 'z' ? proposed : target.z;
    const obstacle = this.findOverlap(x, z, radius);
    if (!obstacle) {
      target[axis] = proposed;
      return;
    }

    this.lastMovement.collided = true;
    if (axis === 'x') this.lastMovement.blockedX = true;
    else this.lastMovement.blockedZ = true;
    if (!this.lastMovement.obstacleIds.includes(obstacle.id)) {
      this.lastMovement.obstacleIds.push(obstacle.id);
    }
  }

  private findOverlap(x: number, z: number, radius: number): AabbCollider | undefined {
    const radiusSq = (radius - COLLISION_EPSILON) ** 2;
    for (const obstacle of this.obstacles) {
      if (obstacle.enabled === false) continue;
      const closestX = THREE.MathUtils.clamp(x, obstacle.minX, obstacle.maxX);
      const closestZ = THREE.MathUtils.clamp(z, obstacle.minZ, obstacle.maxZ);
      const dx = x - closestX;
      const dz = z - closestZ;
      if (dx * dx + dz * dz < radiusSq) return obstacle;
    }
    return undefined;
  }

  private resolveInitialPenetration(target: THREE.Vector3, radius: number, bounds: RectBounds): void {
    for (let pass = 0; pass < 4; pass += 1) {
      const obstacle = this.findOverlap(target.x, target.z, radius);
      if (!obstacle) break;
      this.lastMovement.collided = true;
      if (!this.lastMovement.obstacleIds.includes(obstacle.id)) {
        this.lastMovement.obstacleIds.push(obstacle.id);
      }

      const expandedMinX = obstacle.minX - radius;
      const expandedMaxX = obstacle.maxX + radius;
      const expandedMinZ = obstacle.minZ - radius;
      const expandedMaxZ = obstacle.maxZ + radius;
      const exits = [
        { axis: 'x' as const, value: expandedMinX - COLLISION_EPSILON, distance: Math.abs(target.x - expandedMinX) },
        { axis: 'x' as const, value: expandedMaxX + COLLISION_EPSILON, distance: Math.abs(expandedMaxX - target.x) },
        { axis: 'z' as const, value: expandedMinZ - COLLISION_EPSILON, distance: Math.abs(target.z - expandedMinZ) },
        { axis: 'z' as const, value: expandedMaxZ + COLLISION_EPSILON, distance: Math.abs(expandedMaxZ - target.z) },
      ];
      exits.sort((a, b) => a.distance - b.distance);
      target[exits[0].axis] = exits[0].value;
      if (exits[0].axis === 'x') this.lastMovement.blockedX = true;
      else this.lastMovement.blockedZ = true;
      target.x = THREE.MathUtils.clamp(target.x, bounds.minX, bounds.maxX);
      target.z = THREE.MathUtils.clamp(target.z, bounds.minZ, bounds.maxZ);
    }
  }

  private toInsetBounds(bounds: MovementBounds, radius: number): RectBounds {
    if ('halfWidth' in bounds) {
      this.boundsRect.minX = -bounds.halfWidth + radius;
      this.boundsRect.maxX = bounds.halfWidth - radius;
      this.boundsRect.minZ = -bounds.halfDepth + radius;
      this.boundsRect.maxZ = bounds.halfDepth - radius;
    } else {
      this.boundsRect.minX = bounds.minX + radius;
      this.boundsRect.maxX = bounds.maxX - radius;
      this.boundsRect.minZ = bounds.minZ + radius;
      this.boundsRect.maxZ = bounds.maxZ - radius;
    }

    if (this.boundsRect.minX > this.boundsRect.maxX || this.boundsRect.minZ > this.boundsRect.maxZ) {
      throw new Error('Collision bounds are smaller than the circle collider.');
    }
    return this.boundsRect;
  }

  private resetMovementResult(): void {
    this.lastMovement.collided = false;
    this.lastMovement.blockedX = false;
    this.lastMovement.blockedZ = false;
    this.lastMovement.hitBounds = false;
    this.lastMovement.obstacleIds.length = 0;
  }
}
