import * as THREE from 'three';
import {
  createMedievalPixelTextures,
  disposeMedievalPixelTextures,
  type MedievalPixelTextures,
} from './ProceduralTextures';

export type MedievalAccentKey =
  | 'guild'
  | 'tavern'
  | 'forge'
  | 'library'
  | 'church'
  | 'mageTower'
  | 'market'
  | 'hospital'
  | 'home';

export interface MedievalMaterialLibrary {
  readonly textures: MedievalPixelTextures;
  readonly bodyPrimary: THREE.MeshStandardMaterial;
  readonly bodySecondary: THREE.MeshStandardMaterial;
  readonly trim: THREE.MeshStandardMaterial;
  readonly hazard: THREE.MeshStandardMaterial;
  readonly reward: THREE.MeshStandardMaterial;
  readonly shieldBoost: THREE.MeshStandardMaterial;
  readonly glass: THREE.MeshStandardMaterial;
  readonly emissiveSignal: THREE.MeshStandardMaterial;
  readonly groundContact: THREE.MeshStandardMaterial;
  readonly decalDark: THREE.MeshBasicMaterial;
  readonly decalLight: THREE.MeshBasicMaterial;
  readonly grass: THREE.MeshStandardMaterial;
  readonly grassDark: THREE.MeshStandardMaterial;
  readonly soil: THREE.MeshStandardMaterial;
  readonly cobble: THREE.MeshStandardMaterial;
  readonly stone: THREE.MeshStandardMaterial;
  readonly stoneDark: THREE.MeshStandardMaterial;
  readonly plaster: THREE.MeshStandardMaterial;
  readonly plasterWhite: THREE.MeshStandardMaterial;
  readonly timber: THREE.MeshStandardMaterial;
  readonly timberDark: THREE.MeshStandardMaterial;
  readonly woodLight: THREE.MeshStandardMaterial;
  readonly roofTerracotta: THREE.MeshStandardMaterial;
  readonly roofSlate: THREE.MeshStandardMaterial;
  readonly roofMoss: THREE.MeshStandardMaterial;
  readonly thatch: THREE.MeshStandardMaterial;
  readonly iron: THREE.MeshStandardMaterial;
  readonly metalBright: THREE.MeshStandardMaterial;
  readonly foliageLight: THREE.MeshStandardMaterial;
  readonly foliageMid: THREE.MeshStandardMaterial;
  readonly foliageDark: THREE.MeshStandardMaterial;
  readonly flowers: THREE.MeshStandardMaterial;
  readonly water: THREE.MeshStandardMaterial;
  readonly windowWarm: THREE.MeshStandardMaterial;
  readonly windowCool: THREE.MeshStandardMaterial;
  readonly forgeGlow: THREE.MeshStandardMaterial;
  readonly magicGlow: THREE.MeshStandardMaterial;
  readonly smoke: THREE.MeshStandardMaterial;
  readonly accents: Readonly<Record<MedievalAccentKey, THREE.MeshStandardMaterial>>;
  readonly all: readonly THREE.Material[];
}

function standard(
  name: string,
  parameters: THREE.MeshStandardMaterialParameters,
): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    flatShading: true,
    roughness: 0.82,
    metalness: 0,
    ...parameters,
  });
  material.name = name;
  return material;
}

function basic(name: string, parameters: THREE.MeshBasicMaterialParameters): THREE.MeshBasicMaterial {
  const material = new THREE.MeshBasicMaterial(parameters);
  material.name = name;
  return material;
}

export function createMedievalMaterialLibrary(): MedievalMaterialLibrary {
  const textures = createMedievalPixelTextures();
  textures.grass.repeat.set(24, 20);
  textures.grassDark.repeat.set(8, 8);
  textures.cobble.repeat.set(8, 8);
  textures.stone.repeat.set(4, 4);
  textures.plaster.repeat.set(3, 3);
  textures.shingles.repeat.set(4, 5);
  textures.timber.repeat.set(2, 4);
  textures.water.repeat.set(4, 4);

  const bodyPrimary = standard('mat-body-primary', { color: 0xf6ead0, map: textures.plaster });
  const bodySecondary = standard('mat-body-secondary', { color: 0xd0cdc0, map: textures.stone });
  const trim = standard('mat-trim', { color: 0xd2a75d, roughness: 0.58 });
  const hazard = standard('mat-hazard', { color: 0xb44532, roughness: 0.62 });
  const reward = standard('mat-reward', {
    color: 0xf4bd4a,
    emissive: 0x65400f,
    emissiveIntensity: 0.28,
    roughness: 0.45,
  });
  const shieldBoost = standard('mat-shield-boost', {
    color: 0x70b8c4,
    emissive: 0x163c48,
    emissiveIntensity: 0.3,
    roughness: 0.38,
  });
  const glass = standard('mat-cheap-glass', {
    color: 0x8ec8cf,
    transparent: true,
    opacity: 0.62,
    roughness: 0.24,
    metalness: 0.03,
  });
  const emissiveSignal = standard('mat-emissive-signal', {
    color: 0x41331a,
    emissive: 0xffc35a,
    emissiveIntensity: 1.35,
    roughness: 0.5,
  });
  const groundContact = standard('mat-ground-contact', { color: 0x343329, roughness: 1 });
  const decalDark = basic('mat-decal-dark', { color: 0x30271f, toneMapped: true });
  const decalLight = basic('mat-decal-light', { color: 0xf2dfae, toneMapped: true });

  const grass = standard('mat-grass', { color: 0xffffff, map: textures.grass, roughness: 1 });
  const grassDark = standard('mat-grass-dark', { color: 0xffffff, map: textures.grassDark, roughness: 1 });
  const soil = standard('mat-soil', { color: 0x795a38, roughness: 1 });
  const cobble = standard('mat-cobble', { color: 0xffffff, map: textures.cobble, roughness: 0.94 });
  const stone = standard('mat-stone', { color: 0xffffff, map: textures.stone, roughness: 0.92 });
  const stoneDark = standard('mat-stone-dark', { color: 0x89877c, map: textures.stone, roughness: 0.96 });
  const plaster = standard('mat-plaster', { color: 0xffffff, map: textures.plaster, roughness: 0.94 });
  const plasterWhite = standard('mat-plaster-white', {
    color: 0xfff8df,
    map: textures.plaster,
    roughness: 0.92,
  });
  const timber = standard('mat-timber', { color: 0xffffff, map: textures.timber, roughness: 0.87 });
  const timberDark = standard('mat-timber-dark', { color: 0x775139, map: textures.timber, roughness: 0.93 });
  const woodLight = standard('mat-wood-light', { color: 0xb97b45, roughness: 0.88 });
  const roofTerracotta = standard('mat-roof-terracotta', {
    color: 0xffffff,
    map: textures.shingles,
    roughness: 0.86,
  });
  const roofSlate = standard('mat-roof-slate', { color: 0x48505b, roughness: 0.9 });
  const roofMoss = standard('mat-roof-moss', { color: 0x536742, roughness: 0.96 });
  const thatch = standard('mat-thatch', { color: 0xc39a55, roughness: 1 });
  const iron = standard('mat-iron', { color: 0x363b3c, metalness: 0.72, roughness: 0.52 });
  const metalBright = standard('mat-metal-bright', { color: 0xabb2ae, metalness: 0.82, roughness: 0.38 });
  const foliageLight = standard('mat-foliage-light', { color: 0x6f9b4b, roughness: 1 });
  const foliageMid = standard('mat-foliage-mid', { color: 0x47743e, roughness: 1 });
  const foliageDark = standard('mat-foliage-dark', { color: 0x2e5238, roughness: 1 });
  const flowers = standard('mat-flowers', { color: 0xe3bd62, roughness: 0.9 });
  const water = standard('mat-water', {
    color: 0xffffff,
    map: textures.water,
    transparent: true,
    opacity: 0.86,
    roughness: 0.36,
    metalness: 0.05,
  });
  const windowWarm = standard('mat-window-warm', {
    color: 0x493317,
    emissive: 0xffb84c,
    emissiveIntensity: 0.72,
    roughness: 0.42,
  });
  const windowCool = standard('mat-window-cool', {
    color: 0x28434a,
    emissive: 0x4ca5b5,
    emissiveIntensity: 0.62,
    roughness: 0.4,
  });
  const forgeGlow = standard('mat-forge-glow', {
    color: 0x45180b,
    emissive: 0xff4b12,
    emissiveIntensity: 1.7,
    roughness: 0.46,
  });
  const magicGlow = standard('mat-magic-glow', {
    color: 0x20173f,
    emissive: 0x8e61ff,
    emissiveIntensity: 1.5,
    roughness: 0.4,
  });
  const smoke = standard('mat-smoke', {
    color: 0x77766f,
    transparent: true,
    opacity: 0.68,
    roughness: 1,
    depthWrite: false,
  });

  const accents: Record<MedievalAccentKey, THREE.MeshStandardMaterial> = {
    guild: standard('mat-accent-guild', { color: 0x315b78, roughness: 0.64 }),
    tavern: standard('mat-accent-tavern', { color: 0x9d4e35, roughness: 0.68 }),
    forge: standard('mat-accent-forge', { color: 0x65382e, roughness: 0.76 }),
    library: standard('mat-accent-library', { color: 0x376952, roughness: 0.66 }),
    church: standard('mat-accent-church', { color: 0xd2b06a, roughness: 0.58 }),
    mageTower: standard('mat-accent-mage-tower', { color: 0x65508c, roughness: 0.58 }),
    market: standard('mat-accent-market', { color: 0xb57b32, roughness: 0.7 }),
    hospital: standard('mat-accent-hospital', { color: 0x7ea49e, roughness: 0.62 }),
    home: standard('mat-accent-home', { color: 0x467a87, roughness: 0.66 }),
  };

  const all = [
    bodyPrimary,
    bodySecondary,
    trim,
    hazard,
    reward,
    shieldBoost,
    glass,
    emissiveSignal,
    groundContact,
    decalDark,
    decalLight,
    grass,
    grassDark,
    soil,
    cobble,
    stone,
    stoneDark,
    plaster,
    plasterWhite,
    timber,
    timberDark,
    woodLight,
    roofTerracotta,
    roofSlate,
    roofMoss,
    thatch,
    iron,
    metalBright,
    foliageLight,
    foliageMid,
    foliageDark,
    flowers,
    water,
    windowWarm,
    windowCool,
    forgeGlow,
    magicGlow,
    smoke,
    ...Object.values(accents),
  ] as const;

  return {
    textures,
    bodyPrimary,
    bodySecondary,
    trim,
    hazard,
    reward,
    shieldBoost,
    glass,
    emissiveSignal,
    groundContact,
    decalDark,
    decalLight,
    grass,
    grassDark,
    soil,
    cobble,
    stone,
    stoneDark,
    plaster,
    plasterWhite,
    timber,
    timberDark,
    woodLight,
    roofTerracotta,
    roofSlate,
    roofMoss,
    thatch,
    iron,
    metalBright,
    foliageLight,
    foliageMid,
    foliageDark,
    flowers,
    water,
    windowWarm,
    windowCool,
    forgeGlow,
    magicGlow,
    smoke,
    accents,
    all,
  };
}

export function disposeMedievalMaterialLibrary(library: MedievalMaterialLibrary): void {
  for (const material of new Set(library.all)) material.dispose();
  disposeMedievalPixelTextures(library.textures);
}
