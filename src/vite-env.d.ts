/// <reference types="vite/client" />

interface ThreeGameDiagnostics {
  frame: number;
  elapsed: number;
  score: number;
  targetScore: number;
  complete: boolean;
  seed: number;
  discoveredIds: string[];
  currentLandmark: string | null;
  tavern: {
    open: boolean;
    focusedAgentId: string;
    selectedAgentId: string | null;
    messageCount: number;
  };
  player: {
    position: { x: number; y: number; z: number };
    speed: number;
  };
  collision: {
    obstacleCount: number;
    collided: boolean;
    obstacleIds: string[];
  };
  world: {
    meshes: number;
    instancedMeshes: number;
    instances: number;
    geometries: number;
    materials: number;
    textures: number;
    approximateTriangles: number;
    colliders: number;
    interactionPoints: number;
  };
  renderer: {
    calls: number;
    triangles: number;
    geometries: number;
    textures: number;
  };
  canvas: {
    clientWidth: number;
    clientHeight: number;
    width: number;
    height: number;
    dpr: number;
  };
}

interface ThreeGameTestHooks {
  /** Re-seed the game RNG; all gameplay randomness must flow through it. */
  seed(value: number): void;
  /** Jump to a named deterministic visual/gameplay state. */
  setState(name: string): void;
  /** Freeze the simulation while continuing to render the current frame. */
  setPausedForScreenshot(paused: boolean): void;
  /** Freeze ambient/idle animation time so screenshots are stable. */
  setReducedMotion(enabled: boolean): void;
  /** Hide debug UI (lil-gui) before capturing. */
  hideDebugUi(hidden: boolean): void;
}

interface Window {
  __THREE_GAME_DIAGNOSTICS__?: ThreeGameDiagnostics;
  __THREE_GAME_TEST_HOOKS__?: ThreeGameTestHooks;
}
