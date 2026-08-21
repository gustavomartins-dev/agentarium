import * as THREE from 'three';

export type CameraRigOptions = {
  targetHeight?: number;
  lookAheadSeconds?: number;
  maxLookAhead?: number;
  reducedMotion?: boolean;
};

const DEFAULT_OFFSET = new THREE.Vector3(14, 16.5, 14);

export class CameraRig {
  private readonly desiredPosition = new THREE.Vector3();
  private readonly desiredLookTarget = new THREE.Vector3();
  private readonly lookTarget = new THREE.Vector3();
  private readonly lookAhead = new THREE.Vector3();
  private readonly desiredLookAhead = new THREE.Vector3();
  private readonly sampledVelocity = new THREE.Vector3();
  private readonly previousTarget = new THREE.Vector3();
  private readonly offset: THREE.Vector3;
  private hasPreviousTarget = false;
  private targetHeight: number;
  private lookAheadSeconds: number;
  private maxLookAhead: number;
  private reducedMotion: boolean;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    offset: THREE.Vector3 = DEFAULT_OFFSET,
    options: CameraRigOptions = {},
  ) {
    this.offset = offset.clone();
    this.targetHeight = options.targetHeight ?? 0.9;
    this.lookAheadSeconds = options.lookAheadSeconds ?? 0.34;
    this.maxLookAhead = options.maxLookAhead ?? 2.4;
    this.reducedMotion =
      options.reducedMotion ??
      (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true);
  }

  snapTo(target: THREE.Vector3): void {
    this.lookAhead.set(0, 0, 0);
    this.desiredLookAhead.set(0, 0, 0);
    this.desiredPosition.copy(target).add(this.offset);
    this.camera.position.copy(this.desiredPosition);
    this.lookTarget.copy(target);
    this.lookTarget.y += this.targetHeight;
    this.camera.lookAt(this.lookTarget);
    this.previousTarget.copy(target);
    this.hasPreviousTarget = true;
  }

  update(
    delta: number,
    target: THREE.Vector3,
    lag: number,
    velocity?: Readonly<THREE.Vector3>,
  ): void {
    const safeDelta = THREE.MathUtils.clamp(delta, 0, 0.1);
    if (velocity) {
      this.sampledVelocity.set(velocity.x, 0, velocity.z);
    } else if (this.hasPreviousTarget && safeDelta > 0.0001) {
      this.sampledVelocity.copy(target).sub(this.previousTarget).multiplyScalar(1 / safeDelta);
      this.sampledVelocity.y = 0;
    } else {
      this.sampledVelocity.set(0, 0, 0);
    }

    this.desiredLookAhead.copy(this.sampledVelocity).multiplyScalar(this.lookAheadSeconds);
    if (this.desiredLookAhead.lengthSq() > this.maxLookAhead * this.maxLookAhead) {
      this.desiredLookAhead.setLength(this.maxLookAhead);
    }
    if (this.reducedMotion) this.desiredLookAhead.set(0, 0, 0);

    const lookAheadFactor = this.reducedMotion ? 1 : 1 - Math.exp(-safeDelta / 0.13);
    this.lookAhead.lerp(this.desiredLookAhead, lookAheadFactor);

    this.desiredPosition.copy(target).add(this.offset).addScaledVector(this.lookAhead, 0.38);
    this.desiredLookTarget.copy(target).add(this.lookAhead);
    this.desiredLookTarget.y += this.targetHeight;

    const factor = this.reducedMotion ? 1 : 1 - Math.exp(-safeDelta / Math.max(0.001, lag));
    this.camera.position.lerp(this.desiredPosition, factor);
    this.lookTarget.lerp(this.desiredLookTarget, factor);
    this.camera.lookAt(this.lookTarget);

    this.previousTarget.copy(target);
    this.hasPreviousTarget = true;
  }

  setReducedMotion(enabled: boolean): void {
    this.reducedMotion = enabled;
    if (enabled) {
      this.lookAhead.set(0, 0, 0);
      this.desiredLookAhead.set(0, 0, 0);
    }
  }

  isReducedMotion(): boolean {
    return this.reducedMotion;
  }

  setOffset(x: number, y: number, z: number): void {
    this.offset.set(x, y, z);
  }

  setLookAhead(seconds: number, maxDistance = this.maxLookAhead): void {
    this.lookAheadSeconds = Math.max(0, seconds);
    this.maxLookAhead = Math.max(0, maxDistance);
  }

  setTargetHeight(height: number): void {
    this.targetHeight = height;
  }
}
