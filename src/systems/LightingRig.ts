import * as THREE from 'three';

/** Warm late-afternoon light with a cheap gradient sky and one shadow caster. */
export class LightingRig {
  readonly root = new THREE.Group();
  private readonly sky: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;

  constructor(scene: THREE.Scene) {
    scene.background = new THREE.Color('#c9b77d');
    scene.fog = new THREE.Fog('#c9b77d', 52, 132);

    const hemisphere = new THREE.HemisphereLight('#ffe8ae', '#50613c', 2.15);
    hemisphere.name = 'village-hemisphere-fill';
    this.root.add(hemisphere);

    const sun = new THREE.DirectionalLight('#ffd99a', 3.25);
    sun.name = 'late-afternoon-key';
    sun.position.set(-28, 44, 24);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 110;
    sun.shadow.camera.left = -52;
    sun.shadow.camera.right = 52;
    sun.shadow.camera.top = 52;
    sun.shadow.camera.bottom = -52;
    sun.shadow.bias = -0.00025;
    sun.shadow.normalBias = 0.035;
    this.root.add(sun, sun.target);

    const rim = new THREE.DirectionalLight('#8fc4c1', 0.52);
    rim.name = 'cool-rim-fill';
    rim.position.set(24, 18, -30);
    this.root.add(rim);

    this.sky = this.createSky();
    this.root.add(this.sky);
    scene.add(this.root);
  }

  dispose(): void {
    this.sky.geometry.dispose();
    this.sky.material.dispose();
    this.root.removeFromParent();
  }

  private createSky(): THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial> {
    const geometry = new THREE.SphereGeometry(190, 24, 12);
    const material = new THREE.ShaderMaterial({
      name: 'pixel-sunset-sky',
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uTop: { value: new THREE.Color('#6e8893') },
        uHorizon: { value: new THREE.Color('#e4c686') },
        uSun: { value: new THREE.Color('#ffe8a6') },
        uSunDir: { value: new THREE.Vector3(-0.44, 0.24, -0.32).normalize() },
      },
      vertexShader: `
        varying vec3 vDirection;
        void main() {
          vDirection = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vDirection;
        uniform vec3 uTop;
        uniform vec3 uHorizon;
        uniform vec3 uSun;
        uniform vec3 uSunDir;
        void main() {
          float heightMix = clamp(vDirection.y * 0.72 + 0.35, 0.0, 1.0);
          heightMix = floor(heightMix * 10.0) / 10.0;
          vec3 color = mix(uHorizon, uTop, heightMix);
          float facing = max(dot(normalize(vDirection), uSunDir), 0.0);
          float disc = step(0.992, facing);
          float halo = pow(facing, 18.0) * 0.22;
          gl_FragColor = vec4(color + uSun * (disc * 0.8 + halo), 1.0);
        }
      `,
    });
    const sky = new THREE.Mesh(geometry, material);
    sky.name = 'pixel-gradient-sky';
    sky.frustumCulled = false;
    sky.renderOrder = -100;
    return sky;
  }
}
