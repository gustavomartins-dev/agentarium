import * as THREE from 'three';
import type { InputController } from '../core/InputController';

export type PlayerTuning = {
  speed: number;
  dashMultiplier: number;
  acceleration: number;
  /** Rotates screen-space input into the isometric world. Defaults to 45deg. */
  movementRotation?: number;
};

export type ArenaBounds = {
  halfWidth: number;
  halfDepth: number;
};

export type PlayerMovementResolver = {
  moveCircle(
    position: Readonly<THREE.Vector3>,
    displacement: Readonly<THREE.Vector3>,
    radius: number,
    bounds: ArenaBounds,
    target?: THREE.Vector3,
  ): THREE.Vector3;
};

export class Player {
  readonly group = new THREE.Group();
  readonly velocity = new THREE.Vector3();
  readonly forward = new THREE.Vector3(0, 0, -1);
  readonly collisionRadius = 0.43;
  readonly height = 2.25;

  private readonly move = new THREE.Vector2();
  private readonly targetVelocity = new THREE.Vector3();
  private readonly displacement = new THREE.Vector3();
  private readonly nextPosition = new THREE.Vector3();
  private readonly previousPosition = new THREE.Vector3();
  private readonly visualRoot = new THREE.Group();
  private readonly leftLeg = new THREE.Group();
  private readonly rightLeg = new THREE.Group();
  private readonly leftArm = new THREE.Group();
  private readonly rightArm = new THREE.Group();
  private readonly boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  private readonly shadowGeometry = new THREE.CircleGeometry(0.52, 16);
  private readonly tunicMaterial = this.createMaterial('#345b70');
  private readonly tunicLightMaterial = this.createMaterial('#4c7a8d');
  private readonly leatherMaterial = this.createMaterial('#603e2d');
  private readonly bootMaterial = this.createMaterial('#2c2525');
  private readonly skinMaterial = this.createMaterial('#d99867');
  private readonly hairMaterial = this.createMaterial('#382a26');
  private readonly eyeMaterial = this.createMaterial('#17161b', 0.88);
  private readonly metalMaterial = this.createMaterial('#c7b37b', 0.35, 0.25);
  private readonly capeMaterial = this.createMaterial('#8e3f3f');
  private readonly shadowMaterial = new THREE.MeshBasicMaterial({
    color: '#10110f',
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });

  constructor() {
    this.group.name = 'player-viajante';
    this.visualRoot.name = 'player-voxel-visual';
    this.group.add(this.visualRoot);

    const shadow = new THREE.Mesh(this.shadowGeometry, this.shadowMaterial);
    shadow.name = 'player-shadow';
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.025;
    this.group.add(shadow);

    this.buildLeg(this.leftLeg, -0.21);
    this.buildLeg(this.rightLeg, 0.21);
    this.visualRoot.add(this.leftLeg, this.rightLeg);

    this.createBox('tunic-skirt', this.tunicMaterial, [0.86, 0.42, 0.48], [0, 0.78, 0]);
    this.createBox('torso', this.tunicLightMaterial, [0.82, 0.68, 0.44], [0, 1.19, 0]);
    this.createBox('belt', this.leatherMaterial, [0.9, 0.13, 0.5], [0, 0.91, 0]);

    this.buildArm(this.leftArm, -0.53);
    this.buildArm(this.rightArm, 0.53);
    this.visualRoot.add(this.leftArm, this.rightArm);

    this.createBox('head', this.skinMaterial, [0.64, 0.62, 0.58], [0, 1.86, 0]);
    this.createBox('hair-cap', this.hairMaterial, [0.69, 0.18, 0.63], [0, 2.12, 0.03]);
    this.createBox('hair-back', this.hairMaterial, [0.68, 0.45, 0.16], [0, 1.91, 0.29]);
    this.createBox('hair-left', this.hairMaterial, [0.12, 0.38, 0.5], [-0.3, 1.96, 0.03]);
    this.createBox('hair-right', this.hairMaterial, [0.12, 0.38, 0.5], [0.3, 1.96, 0.03]);
    this.createBox('eye-left', this.eyeMaterial, [0.09, 0.1, 0.045], [-0.14, 1.91, -0.305]);
    this.createBox('eye-right', this.eyeMaterial, [0.09, 0.1, 0.045], [0.14, 1.91, -0.305]);

    this.createBox('cape', this.capeMaterial, [0.72, 0.92, 0.11], [0, 1.17, 0.29]);
  }

  update(
    delta: number,
    elapsed: number,
    input: InputController,
    tuning: PlayerTuning,
    bounds: ArenaBounds,
    collision?: PlayerMovementResolver,
  ): void {
    input.readMovement(this.move);
    const dash = input.isDashHeld() ? tuning.dashMultiplier : 1;
    const rotation = tuning.movementRotation ?? Math.PI / 4;
    const cosine = Math.cos(rotation);
    const sine = Math.sin(rotation);
    this.targetVelocity
      .set(
        this.move.x * cosine + this.move.y * sine,
        0,
        -this.move.x * sine + this.move.y * cosine,
      )
      .multiplyScalar(tuning.speed * dash);

    const safeDelta = THREE.MathUtils.clamp(delta, 0, 0.05);
    const smoothing = 1 - Math.exp(-tuning.acceleration * safeDelta);
    this.velocity.lerp(this.targetVelocity, smoothing);
    this.displacement.copy(this.velocity).multiplyScalar(safeDelta);
    this.previousPosition.copy(this.group.position);

    if (collision) {
      collision.moveCircle(
        this.group.position,
        this.displacement,
        this.collisionRadius,
        bounds,
        this.nextPosition,
      );
      this.group.position.copy(this.nextPosition);
      if (safeDelta > 0.0001) {
        const actualX = (this.group.position.x - this.previousPosition.x) / safeDelta;
        const actualZ = (this.group.position.z - this.previousPosition.z) / safeDelta;
        if (Math.abs(actualX) + 0.001 < Math.abs(this.velocity.x)) this.velocity.x = actualX;
        if (Math.abs(actualZ) + 0.001 < Math.abs(this.velocity.z)) this.velocity.z = actualZ;
      }
    } else {
      this.group.position.add(this.displacement);
      this.group.position.x = THREE.MathUtils.clamp(
        this.group.position.x,
        -bounds.halfWidth + this.collisionRadius,
        bounds.halfWidth - this.collisionRadius,
      );
      this.group.position.z = THREE.MathUtils.clamp(
        this.group.position.z,
        -bounds.halfDepth + this.collisionRadius,
        bounds.halfDepth - this.collisionRadius,
      );
    }

    if (this.velocity.lengthSq() > 0.001) {
      const targetRotation = Math.atan2(-this.velocity.x, -this.velocity.z);
      const rotationDelta = Math.atan2(
        Math.sin(targetRotation - this.group.rotation.y),
        Math.cos(targetRotation - this.group.rotation.y),
      );
      this.group.rotation.y += rotationDelta * (1 - Math.exp(-18 * safeDelta));
      this.forward.set(0, 0, -1).applyAxisAngle(THREE.Object3D.DEFAULT_UP, this.group.rotation.y);
    }

    this.animate(elapsed, tuning.speed, dash > 1, input.isActionHeld());
  }

  dispose(): void {
    this.boxGeometry.dispose();
    this.shadowGeometry.dispose();
    this.tunicMaterial.dispose();
    this.tunicLightMaterial.dispose();
    this.leatherMaterial.dispose();
    this.bootMaterial.dispose();
    this.skinMaterial.dispose();
    this.hairMaterial.dispose();
    this.eyeMaterial.dispose();
    this.metalMaterial.dispose();
    this.capeMaterial.dispose();
    this.shadowMaterial.dispose();
  }

  private buildLeg(pivot: THREE.Group, x: number): void {
    pivot.position.set(x, 0.69, 0);
    this.createBox('trouser', this.leatherMaterial, [0.27, 0.54, 0.3], [0, -0.27, 0], pivot);
    this.createBox('boot', this.bootMaterial, [0.3, 0.27, 0.43], [0, -0.57, -0.055], pivot);
  }

  private buildArm(pivot: THREE.Group, x: number): void {
    pivot.position.set(x, 1.43, 0);
    this.createBox('sleeve', this.tunicMaterial, [0.26, 0.5, 0.3], [0, -0.23, 0], pivot);
    this.createBox('hand', this.skinMaterial, [0.24, 0.25, 0.27], [0, -0.57, -0.01], pivot);
  }

  private createBox(
    name: string,
    material: THREE.Material,
    scale: [number, number, number],
    position: [number, number, number],
    parent: THREE.Object3D = this.visualRoot,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(this.boxGeometry, material);
    mesh.name = name;
    mesh.scale.set(...scale);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  private createMaterial(color: THREE.ColorRepresentation, roughness = 0.72, metalness = 0.02): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      flatShading: true,
    });
  }

  private animate(elapsed: number, baseSpeed: number, dashing: boolean, acting: boolean): void {
    const speedRatio = THREE.MathUtils.clamp(this.velocity.length() / Math.max(baseSpeed, 0.001), 0, 1.6);
    const stride = Math.sin(elapsed * (9 + speedRatio * 3)) * Math.min(speedRatio * 0.62, 0.72);
    const settle = Math.min(speedRatio * 7, 1);
    this.leftLeg.rotation.x = stride;
    this.rightLeg.rotation.x = -stride;
    this.leftArm.rotation.x = -stride * 0.72;
    this.rightArm.rotation.x = acting ? -1.05 : stride * 0.72;
    this.visualRoot.position.y = 0.045 + Math.abs(Math.sin(elapsed * 10.5)) * 0.055 * settle;
    this.visualRoot.rotation.x = THREE.MathUtils.lerp(this.visualRoot.rotation.x, dashing ? -0.11 : 0, 0.16);
    this.visualRoot.rotation.z = THREE.MathUtils.lerp(this.visualRoot.rotation.z, -stride * 0.035, 0.18);
  }
}
