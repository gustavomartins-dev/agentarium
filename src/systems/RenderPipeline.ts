import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FullScreenQuad, Pass } from 'three/addons/postprocessing/Pass.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';

/**
 * Mobile-friendly nearest-neighbour pass. It keeps the chunky pixel language
 * but renders the world once instead of adding a second normal-buffer render.
 */
class SingleRenderPixelPass extends Pass {
  private readonly target = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    type: THREE.HalfFloatType,
    depthBuffer: true,
  });
  private readonly material = new THREE.ShaderMaterial({
    name: 'single-render-mobile-pixel-pass',
    uniforms: { tDiffuse: { value: this.target.texture } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      varying vec2 vUv;
      void main() {
        gl_FragColor = texture2D(tDiffuse, vUv);
      }
    `,
    depthWrite: false,
    depthTest: false,
  });
  private readonly quad = new FullScreenQuad(this.material);
  private width = 1;
  private height = 1;
  private pixelSize = 3;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly camera: THREE.Camera,
  ) {
    super();
  }

  override render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget): void {
    renderer.setRenderTarget(this.target);
    renderer.clear();
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    if (this.clear) renderer.clear();
    this.quad.render(renderer);
  }

  override setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.resizeTarget();
  }

  setPixelSize(pixelSize: number): void {
    this.pixelSize = Math.max(1, Math.round(pixelSize));
    this.resizeTarget();
  }

  override dispose(): void {
    this.target.dispose();
    this.material.dispose();
    this.quad.dispose();
  }

  private resizeTarget(): void {
    this.target.setSize(
      Math.max(1, Math.floor(this.width / this.pixelSize)),
      Math.max(1, Math.floor(this.height / this.pixelSize)),
    );
  }
}

/**
 * A deliberately small render pipeline. The pixel pass is the visual signature:
 * it downsamples color, depth and normals together so silhouettes remain readable
 * instead of merely stretching a low-resolution canvas.
 */
export class RenderPipeline {
  private readonly composer: EffectComposer;
  private readonly pixelPass: RenderPixelatedPass;
  private readonly mobilePixelPass: SingleRenderPixelPass;
  private width = 0;
  private height = 0;
  private dpr = 0;
  private mobile = false;
  private overlayOpen = false;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
  ) {
    this.renderer.info.autoReset = false;
    this.composer = new EffectComposer(renderer);
    this.pixelPass = new RenderPixelatedPass(3, scene, camera, {
      normalEdgeStrength: 0.34,
      depthEdgeStrength: 0.22,
    });
    this.mobilePixelPass = new SingleRenderPixelPass(scene, camera);
    this.mobilePixelPass.enabled = false;
    this.composer.addPass(this.pixelPass);
    this.composer.addPass(this.mobilePixelPass);
    this.composer.addPass(new OutputPass());
  }

  render(): void {
    this.renderer.info.reset();
    this.composer.render();
  }

  /** A modal obscures the world, so the cheaper single-render pixel pass is enough. */
  setOverlayOpen(open: boolean): void {
    if (open === this.overlayOpen) return;
    this.overlayOpen = open;
    this.updateEnabledPass();
  }

  resize(maxDpr: number): void {
    const canvas = this.renderer.domElement;
    const width = Math.max(1, Math.floor(canvas.clientWidth));
    const height = Math.max(1, Math.floor(canvas.clientHeight));
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    if (width === this.width && height === this.height && dpr === this.dpr) return;

    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(width, height);
    this.mobile = width <= 520;
    this.updateEnabledPass();
    this.pixelPass.setPixelSize(3);
    this.mobilePixelPass.setPixelSize(3);
  }

  dispose(): void {
    this.pixelPass.dispose();
    this.mobilePixelPass.dispose();
    this.composer.dispose();
  }

  private updateEnabledPass(): void {
    const useSingleRenderPass = this.mobile || this.overlayOpen;
    this.pixelPass.enabled = !useSingleRenderPass;
    this.mobilePixelPass.enabled = useSingleRenderPass;
  }
}
