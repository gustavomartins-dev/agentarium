import * as THREE from 'three';

export interface MedievalPixelTextures {
  grass: THREE.DataTexture;
  grassDark: THREE.DataTexture;
  cobble: THREE.DataTexture;
  stone: THREE.DataTexture;
  plaster: THREE.DataTexture;
  shingles: THREE.DataTexture;
  timber: THREE.DataTexture;
  water: THREE.DataTexture;
}

type Rgb = readonly [number, number, number];

const clampByte = (value: number): number => Math.max(0, Math.min(255, Math.round(value)));

function hash2d(x: number, y: number, seed: number): number {
  let value = Math.imul(x + seed * 374_761_393, 668_265_263);
  value = Math.imul(value ^ (value >>> 13) ^ y, 1_274_126_177);
  return ((value ^ (value >>> 16)) >>> 0) / 4_294_967_295;
}

function tint(color: Rgb, amount: number): Rgb {
  return [clampByte(color[0] + amount), clampByte(color[1] + amount), clampByte(color[2] + amount)];
}

function createTexture(
  name: string,
  width: number,
  height: number,
  pixel: (x: number, y: number) => Rgb,
): THREE.DataTexture {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const color = pixel(x, y);
      const index = (y * width + x) * 4;
      data[index] = color[0];
      data[index + 1] = color[1];
      data[index + 2] = color[2];
      data[index + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.UnsignedByteType);
  texture.name = name;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapNearestFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 1;
  texture.needsUpdate = true;
  return texture;
}

function createGrassTexture(name: string, base: Rgb, seed: number): THREE.DataTexture {
  return createTexture(name, 16, 16, (x, y) => {
    const coarse = hash2d(Math.floor(x / 2), Math.floor(y / 2), seed);
    const fine = hash2d(x, y, seed + 17);
    const blades = (x + y * 3 + seed) % 11 === 0 ? 18 : 0;
    return tint(base, Math.floor(coarse * 17 - 8 + fine * 5 + blades));
  });
}

function createCobbleTexture(): THREE.DataTexture {
  const mortar: Rgb = [112, 99, 76];
  const stones: readonly Rgb[] = [
    [151, 137, 105],
    [133, 122, 96],
    [166, 148, 112],
    [122, 113, 91],
  ];
  return createTexture('pixel-cobble', 16, 16, (x, y) => {
    const row = Math.floor(y / 4);
    const offset = row % 2 === 0 ? 0 : 2;
    const localX = (x + offset) % 5;
    const localY = y % 4;
    if (localX === 0 || localY === 0) return mortar;
    const stone = stones[(Math.floor((x + offset) / 5) + row * 3) % stones.length];
    return tint(stone, hash2d(x, y, 31) > 0.76 ? 10 : 0);
  });
}

function createStoneTexture(): THREE.DataTexture {
  const mortar: Rgb = [85, 82, 73];
  const stones: readonly Rgb[] = [
    [137, 135, 121],
    [151, 147, 130],
    [121, 122, 112],
    [161, 153, 134],
  ];
  return createTexture('pixel-stone', 16, 16, (x, y) => {
    const row = Math.floor(y / 3);
    const offset = row % 2 === 0 ? 0 : 3;
    const localX = (x + offset) % 6;
    if (y % 3 === 0 || localX === 0) return mortar;
    return tint(stones[(Math.floor((x + offset) / 6) + row) % stones.length], hash2d(x, y, 51) * 8 - 4);
  });
}

function createPlasterTexture(): THREE.DataTexture {
  const base: Rgb = [221, 205, 164];
  return createTexture('pixel-plaster', 16, 16, (x, y) => {
    const speckle = hash2d(x, y, 79);
    const crack = (x === 4 && y > 9) || (x === 5 && y === 9) ? -34 : 0;
    return tint(base, Math.floor(speckle * 13 - 7 + crack));
  });
}

function createShingleTexture(): THREE.DataTexture {
  const colors: readonly Rgb[] = [
    [126, 52, 42],
    [145, 61, 48],
    [105, 46, 41],
    [157, 70, 51],
  ];
  return createTexture('pixel-shingles', 16, 16, (x, y) => {
    const row = Math.floor(y / 3);
    const offset = row % 2 === 0 ? 0 : 2;
    const seam = (x + offset) % 4 === 0 || y % 3 === 0;
    if (seam) return [72, 42, 38];
    return colors[(Math.floor((x + offset) / 4) + row) % colors.length];
  });
}

function createTimberTexture(): THREE.DataTexture {
  return createTexture('pixel-timber', 8, 16, (x, y) => {
    const grain = (x + Math.floor(hash2d(x, y, 101) * 3)) % 4 === 0;
    const knot = (x - 5) ** 2 + (y - 9) ** 2 < 3;
    return knot ? [58, 34, 24] : grain ? [79, 47, 29] : [101, 59, 34];
  });
}

function createWaterTexture(): THREE.DataTexture {
  return createTexture('pixel-water', 16, 16, (x, y) => {
    const wave = (x + y * 2) % 7 === 0 || (x + 4 - y) % 11 === 0;
    return wave ? [111, 177, 173] : [67, 133, 139];
  });
}

export function createMedievalPixelTextures(): MedievalPixelTextures {
  return {
    grass: createGrassTexture('pixel-grass', [82, 111, 58], 7),
    grassDark: createGrassTexture('pixel-grass-dark', [56, 82, 50], 19),
    cobble: createCobbleTexture(),
    stone: createStoneTexture(),
    plaster: createPlasterTexture(),
    shingles: createShingleTexture(),
    timber: createTimberTexture(),
    water: createWaterTexture(),
  };
}

export function disposeMedievalPixelTextures(textures: MedievalPixelTextures): void {
  for (const texture of Object.values(textures)) texture.dispose();
}
