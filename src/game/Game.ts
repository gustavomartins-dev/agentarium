import * as THREE from 'three';
import { InputController } from '../core/InputController';
import { Loop } from '../core/Loop';
import { createRenderer, resizeRenderer } from '../core/Renderer';
import { TAVERN_AGENTS, type TavernState } from '../domain/Agent';
import { Player, type ArenaBounds } from '../entities/Player';
import { AudioSystem } from '../systems/AudioSystem';
import { CameraRig } from '../systems/CameraRig';
import {
  CollisionSystem,
  type AabbCollider,
  type Landmark,
} from '../systems/CollisionSystem';
import { DebugTools, type DebugTuning } from '../systems/DebugTools';
import {
  HUD_EVENTS,
  Hud,
  type HudAudioDetail,
  type HudBuilding,
  type HudInteractDetail,
} from '../systems/Hud';
import { LightingRig } from '../systems/LightingRig';
import { RenderPipeline } from '../systems/RenderPipeline';
import { TavernPanel } from '../systems/TavernPanel';
import { TavernSystem } from '../systems/TavernSystem';
import {
  buildMedievalVillage,
  type LandmarkId,
  type MedievalVillageWorld,
  type VillageInteractionPoint,
} from '../world/VillageWorld';

const LANDMARK_TOTAL = 9;

const TEST_LANDMARK_STATES: Readonly<Record<string, LandmarkId>> = {
  'near-guild': 'guild',
  'near-tavern': 'tavern',
  'near-forge': 'forge',
  'near-library': 'library',
  'near-church': 'church',
  'near-mage-tower': 'mageTower',
  'near-market': 'market',
  'near-hospital': 'hospital',
  'near-home': 'home',
};

const BUILDING_ICONS: Record<LandmarkId, string> = {
  guild: '⚔',
  tavern: '♨',
  forge: '⚒',
  library: '◈',
  church: '✥',
  mageTower: '✦',
  market: '◇',
  hospital: '✚',
  home: '⌂',
};

export class Game {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(45, 1, 0.1, 220);
  private readonly input: InputController;
  private readonly player = new Player();
  private readonly collision = new CollisionSystem();
  private readonly audio = new AudioSystem();
  private readonly hud = new Hud();
  private readonly tavern = new TavernSystem();
  private tavernState: TavernState = this.tavern.getState();
  private readonly tavernPanel = new TavernPanel(this.tavern);
  private readonly cameraRig = new CameraRig(this.camera);
  private readonly world: MedievalVillageWorld;
  private readonly lighting: LightingRig;
  private readonly pipeline: RenderPipeline;
  private readonly loop: Loop;
  private readonly debugTools: DebugTools;
  private readonly worldBounds: ArenaBounds;
  private readonly visited = new Set<LandmarkId>();
  private readonly interactionMarkers = new Map<LandmarkId, THREE.Object3D>();

  private readonly tuning: DebugTuning = {
    speed: 6.15,
    dashMultiplier: 1.72,
    acceleration: 13,
    movementRotation: Math.PI / 4,
    cameraLag: 0.16,
    exposure: 1.08,
    maxDpr: window.matchMedia('(max-width: 720px)').matches ? 1.5 : 2,
  };

  private frame = 0;
  private elapsed = 0;
  private complete = false;
  private pausedForScreenshot = false;
  private reducedMotion = false;
  private seed = 1;
  private currentInteraction: VillageInteractionPoint | null = null;
  private lastHudInteractionAt = Number.NEGATIVE_INFINITY;
  private unsubscribeTavern: (() => void) | null = null;

  private readonly onHudInteract = (event: Event): void => {
    const detail = (event as CustomEvent<HudInteractDetail>).detail;
    this.lastHudInteractionAt = performance.now();
    this.interact(detail?.building?.id as LandmarkId | undefined);
  };

  private readonly onAudioToggle = (event: Event): void => {
    const detail = (event as CustomEvent<HudAudioDetail>).detail;
    this.audio.setMuted(Boolean(detail?.muted));
  };

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.renderer = createRenderer(canvas);
    this.renderer.toneMappingExposure = this.tuning.exposure;

    this.world = buildMedievalVillage();
    this.scene.add(this.world.root);
    this.world.root.traverse((object) => {
      if (!object.name.startsWith('interaction-marker-')) return;
      this.interactionMarkers.set(object.userData.landmarkId as LandmarkId, object);
    });
    this.lighting = new LightingRig(this.scene);
    this.pipeline = new RenderPipeline(this.renderer, this.scene, this.camera);

    this.worldBounds = {
      halfWidth: Math.min(Math.abs(this.world.bounds.min.x), Math.abs(this.world.bounds.max.x)),
      halfDepth: Math.min(Math.abs(this.world.bounds.min.z), Math.abs(this.world.bounds.max.z)),
    };
    this.configureCollisionWorld();

    this.player.group.position.copy(this.world.spawnPoint);
    this.player.group.position.y = 0;
    this.scene.add(this.player.group);

    const stick = this.getElement('#touch-stick');
    const knob = this.getElement('#touch-knob');
    const actionButton = this.getElement('#dash-button');
    this.input = new InputController(stick, knob, actionButton);

    this.debugTools = new DebugTools(this.tuning, () => {
      this.renderer.toneMappingExposure = this.tuning.exposure;
      this.resize();
    });
    this.loop = new Loop(
      (delta) => this.update(delta),
      () => this.render(),
    );

    window.addEventListener(HUD_EVENTS.interact, this.onHudInteract);
    window.addEventListener(HUD_EVENTS.audioToggle, this.onAudioToggle);

    this.unsubscribeTavern = this.tavern.subscribe((state) => {
      this.tavernState = state;
      const agent = state.selectedAgentId ? TAVERN_AGENTS[state.selectedAgentId] : null;
      this.hud.setActiveAgent(
        agent
          ? { id: agent.id, name: agent.name, role: agent.role, sigil: agent.sigil }
          : null,
      );
    });

    this.hud.setTarget(LANDMARK_TOTAL);
    this.hud.setObjective('Conheça os locais da vila');
    this.updateProximity();
    this.cameraRig.snapTo(this.player.group.position);
    this.resize();
    this.installTestHooks();
    this.publishDiagnostics();
  }

  start(): void {
    this.loop.start();
  }

  dispose(): void {
    this.loop.stop();
    window.removeEventListener(HUD_EVENTS.interact, this.onHudInteract);
    window.removeEventListener(HUD_EVENTS.audioToggle, this.onAudioToggle);
    this.unsubscribeTavern?.();
    this.unsubscribeTavern = null;
    this.input.dispose();
    this.tavernPanel.dispose();
    this.tavern.dispose();
    this.hud.dispose();
    this.audio.dispose();
    this.debugTools.dispose();
    this.player.dispose();
    this.world.dispose();
    this.lighting.dispose();
    this.pipeline.dispose();
    this.renderer.dispose();
    window.__THREE_GAME_DIAGNOSTICS__ = undefined;
    window.__THREE_GAME_TEST_HOOKS__ = undefined;
  }

  private update(delta: number): void {
    this.frame += 1;
    this.resize();
    if (this.pausedForScreenshot) {
      this.publishDiagnostics();
      return;
    }

    this.elapsed += delta;
    const animationTime = this.reducedMotion ? 0 : this.elapsed;
    this.world.update(animationTime);
    const dialogOpen = document.querySelector('dialog[open]') !== null;
    if (dialogOpen) this.input.clearTransientState();
    this.player.update(
      delta,
      animationTime,
      this.input,
      this.tuning,
      this.worldBounds,
      this.collision,
    );

    this.audio.footstep(this.elapsed, this.player.velocity.length());
    this.updateProximity();

    const actionPressed = this.input.consumeActionPressed();
    if (
      actionPressed &&
      !dialogOpen &&
      performance.now() - this.lastHudInteractionAt > 120
    ) {
      this.interact();
    }

    this.cameraRig.update(
      delta,
      this.player.group.position,
      this.tuning.cameraLag,
      this.player.velocity,
    );
    this.hud.update(this.visited.size, LANDMARK_TOTAL, this.elapsed, this.complete);
    this.publishDiagnostics();
  }

  private render(): void {
    this.pipeline.setOverlayOpen(document.querySelector('dialog[open]') !== null);
    this.pipeline.render();
  }

  private resize(): void {
    resizeRenderer(this.renderer, this.camera, this.tuning.maxDpr);
    this.pipeline.resize(this.tuning.maxDpr);
  }

  private configureCollisionWorld(): void {
    const obstacles: AabbCollider[] = [];
    for (const collider of this.world.colliders) {
      if (!collider.blocksMovement) continue;
      if (collider.kind === 'aabb' && collider.bounds) {
        obstacles.push({
          id: collider.id,
          label: collider.landmarkId,
          minX: collider.bounds.min.x,
          maxX: collider.bounds.max.x,
          minZ: collider.bounds.min.z,
          maxZ: collider.bounds.max.z,
        });
      } else if (collider.kind === 'circle' && collider.center && collider.radius) {
        obstacles.push({
          id: collider.id,
          label: collider.landmarkId,
          minX: collider.center.x - collider.radius,
          maxX: collider.center.x + collider.radius,
          minZ: collider.center.y - collider.radius,
          maxZ: collider.center.y + collider.radius,
        });
      }
    }
    this.collision.setObstacles(obstacles);

    const landmarks: Landmark[] = this.world.interactionPoints.map((point) => ({
      id: point.landmarkId,
      label: point.label,
      position: point.position,
      radius: point.radius,
      kind: 'building',
      metadata: {
        description: point.description,
        action: point.action,
      },
    }));
    this.collision.setLandmarks(landmarks);
  }

  private updateProximity(): void {
    const proximity = this.collision.updateLandmarkProximity(this.player.group.position, 0.1);
    const nearestNearby = proximity.nearby[0]?.landmark;
    this.currentInteraction = nearestNearby
      ? this.world.interactionPoints.find((point) => point.landmarkId === nearestNearby.id) ?? null
      : null;

    const nearbyBuilding = this.currentInteraction
      ? this.toHudBuilding(this.currentInteraction.landmarkId)
      : null;
    this.hud.setProximity(nearbyBuilding);
    this.hud.setLocation(this.describeLocation());
    this.updateInteractionMarkers();
  }

  private updateInteractionMarkers(): void {
    for (const point of this.world.interactionPoints) {
      const marker = this.interactionMarkers.get(point.landmarkId);
      if (!marker) continue;
      const distance = Math.hypot(
        this.player.group.position.x - point.position.x,
        this.player.group.position.z - point.position.z,
      );
      marker.visible = !this.visited.has(point.landmarkId) && distance <= 10;
    }
  }

  private describeLocation(): string {
    if (this.currentInteraction) return `Entrada da ${this.currentInteraction.label}`;

    const nearest = this.collision.getNearestLandmark(this.player.group.position, 9.5);
    if (nearest) return `Arredores da ${nearest.landmark.label}`;

    const { x, z } = this.player.group.position;
    if (z > 24) return 'Caminho Sul';
    if (z < -20) return 'Colinas do Norte';
    if (x < -14) return 'Bairro dos Artesãos';
    if (x > 14) return 'Jardins do Leste';
    return 'Praça da Vila';
  }

  private interact(explicitId?: LandmarkId): void {
    const point = explicitId
      ? this.world.interactionPoints.find((candidate) => candidate.landmarkId === explicitId) ?? null
      : this.currentInteraction ?? this.world.findClosestInteraction(this.player.group.position);
    if (!point) return;

    const firstDiscovery = !this.visited.has(point.landmarkId);
    if (firstDiscovery) {
      this.visited.add(point.landmarkId);
      this.audio.discovery(this.visited.size - 1);
      this.hud.flashPickup();
      this.complete = this.visited.size === LANDMARK_TOTAL;
    } else {
      this.audio.ui();
    }

    this.hud.setDiscovery(this.visited.size, LANDMARK_TOTAL);
    this.updateInteractionMarkers();
    if (point.landmarkId === 'tavern') this.tavernPanel.open();
    else this.hud.openBuilding(this.toHudBuilding(point.landmarkId));
    this.publishDiagnostics();
  }

  private toHudBuilding(id: LandmarkId): HudBuilding {
    const landmark = this.world.landmarks.get(id);
    if (!landmark) throw new Error(`Landmark not found: ${id}`);
    let status = this.visited.has(id)
      ? 'Local descoberto · função em construção'
      : 'Novo local · função em construção';
    if (id === 'tavern') {
      const selectedAgentId = this.tavernState.selectedAgentId;
      status = selectedAgentId
        ? `${TAVERN_AGENTS[selectedAgentId].name} está ativo`
        : 'Aberta · três agentes disponíveis';
    }

    return {
      id,
      name: landmark.label,
      purpose: landmark.purpose,
      icon: BUILDING_ICONS[id],
      status,
    };
  }

  private installTestHooks(): void {
    window.__THREE_GAME_TEST_HOOKS__ = {
      seed: (value: number) => {
        this.seed = Number.isFinite(value) ? Math.trunc(value) : 1;
      },
      setState: (name: string) => {
        if (name === 'active-play') this.resetRun();
        else if (name === 'complete') this.completeRun();
        else if (name === 'tavern-open') this.openTavernForTest();
        else if (TEST_LANDMARK_STATES[name]) this.moveToLandmark(TEST_LANDMARK_STATES[name]);
        else console.warn(`Unknown test state: ${name}`);
      },
      setPausedForScreenshot: (paused: boolean) => {
        this.pausedForScreenshot = paused;
      },
      setReducedMotion: (enabled: boolean) => {
        this.reducedMotion = enabled;
        this.cameraRig.setReducedMotion(enabled);
      },
      hideDebugUi: (hidden: boolean) => {
        this.debugTools.setHidden(hidden);
      },
    };
  }

  private resetRun(): void {
    this.visited.clear();
    this.elapsed = 0;
    this.complete = false;
    this.hud.closeBuilding();
    this.tavernPanel.close();
    this.tavern.reset();
    this.player.group.position.copy(this.world.spawnPoint);
    this.player.group.position.y = 0;
    this.player.velocity.set(0, 0, 0);
    this.world.update(0);
    this.updateProximity();
    this.cameraRig.snapTo(this.player.group.position);
    this.hud.update(0, LANDMARK_TOTAL, 0, false);
    this.publishDiagnostics();
  }

  private moveToLandmark(id: LandmarkId): void {
    this.resetRun();
    const point = this.world.landmarks.get(id)?.interaction;
    if (!point) return;
    this.player.group.position.copy(point.position);
    this.player.group.position.y = 0;
    this.updateProximity();
    this.cameraRig.snapTo(this.player.group.position);
    this.publishDiagnostics();
  }

  private openTavernForTest(): void {
    this.moveToLandmark('tavern');
    this.interact('tavern');
  }

  private completeRun(): void {
    this.hud.closeBuilding();
    this.tavernPanel.close();
    this.tavern.reset();
    this.visited.clear();
    for (const id of this.world.landmarks.keys()) this.visited.add(id);
    this.complete = true;
    this.elapsed = 0;
    this.player.group.position.set(-3.2, 0, 4);
    this.player.velocity.set(0, 0, 0);
    this.updateProximity();
    this.cameraRig.snapTo(this.player.group.position);
    this.hud.update(this.visited.size, LANDMARK_TOTAL, this.elapsed, true);
    this.publishDiagnostics();
  }

  private publishDiagnostics(): void {
    const info = this.renderer.info;
    window.__THREE_GAME_DIAGNOSTICS__ = {
      frame: this.frame,
      elapsed: this.elapsed,
      score: this.visited.size,
      targetScore: LANDMARK_TOTAL,
      complete: this.complete,
      seed: this.seed,
      discoveredIds: [...this.visited],
      currentLandmark: this.currentInteraction?.landmarkId ?? null,
      tavern: {
        open: this.tavernPanel.isOpen(),
        focusedAgentId: this.tavernState.focusedAgentId,
        selectedAgentId: this.tavernState.selectedAgentId,
        messageCount:
          this.tavernState.conversations[this.tavernState.focusedAgentId].length,
      },
      player: {
        position: {
          x: this.player.group.position.x,
          y: this.player.group.position.y,
          z: this.player.group.position.z,
        },
        speed: this.player.velocity.length(),
      },
      collision: {
        obstacleCount: this.collision.getObstacles().length,
        collided: this.collision.lastMovement.collided,
        obstacleIds: [...this.collision.lastMovement.obstacleIds],
      },
      world: this.world.diagnostics,
      renderer: {
        calls: info.render.calls,
        triangles: info.render.triangles,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
      },
      canvas: {
        clientWidth: this.canvas.clientWidth,
        clientHeight: this.canvas.clientHeight,
        width: this.canvas.width,
        height: this.canvas.height,
        dpr: Math.min(window.devicePixelRatio || 1, this.tuning.maxDpr),
      },
    };
  }

  private getElement(selector: string): HTMLElement {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`Missing element: ${selector}`);
    return element;
  }
}
