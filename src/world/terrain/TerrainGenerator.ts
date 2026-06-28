// ============================================================
// PIXEL EARTH — Terrain Generator
// Generates procedural terrain chunks using layered noise.
// Deterministic: same seed always produces same world.
// ============================================================

import type { Chunk, Tile } from '../../core/types';
import { Biome, CHUNK_SIZE } from '../../core/types';

// ─── Pseudo-random noise (seedable) ──────────────────────────

function mulberry32(seed: number) {
  return function (): number {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Smooth noise via bilinear interpolation over a grid.
 * Produces values in [0, 1].
 */
function smoothNoise(x: number, y: number, seed: number, scale: number): number {
  const fx = x / scale;
  const fy = y / scale;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const tx = fx - x0;
  const ty = fy - y0;

  const r = mulberry32;
  const h = (gx: number, gy: number) => r(seed ^ (gx * 374761393 + gy * 668265263))();

  const v00 = h(x0, y0);
  const v10 = h(x0 + 1, y0);
  const v01 = h(x0, y0 + 1);
  const v11 = h(x0 + 1, y0 + 1);

  // Smooth step
  const ux = tx * tx * (3 - 2 * tx);
  const uy = ty * ty * (3 - 2 * ty);

  return v00 * (1 - ux) * (1 - uy) +
         v10 * ux       * (1 - uy) +
         v01 * (1 - ux) * uy       +
         v11 * ux       * uy;
}

/** Fractional Brownian Motion — layered octaves for natural-looking terrain. */
function fbm(x: number, y: number, seed: number, octaves = 6): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let max = 0;
  const scales = [200, 100, 50, 25, 12, 6];

  for (let i = 0; i < octaves; i++) {
    value += smoothNoise(x * frequency, y * frequency, seed + i * 1000, scales[i] ?? 3) * amplitude;
    max += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value / max;
}

// ─── Biome classification ─────────────────────────────────────

function classifyBiome(elevation: number, moisture: number, temperature: number): Biome {
  if (elevation < 0.35) return Biome.Ocean;
  if (elevation < 0.38) return Biome.Beach;
  if (elevation > 0.85) {
    if (temperature < 0) return Biome.Snow;
    return Biome.Mountain;
  }
  if (elevation > 0.75 && temperature > 50) return Biome.Volcano;
  if (temperature < -5) return Biome.Snow;
  if (moisture > 0.75 && temperature > 15) return Biome.Jungle;
  if (moisture > 0.6) return Biome.Forest;
  if (moisture > 0.45 && elevation < 0.55) return Biome.Swamp;
  if (moisture < 0.25) return Biome.Desert;
  return Biome.Grassland;
}

// ─── Tile colour palette (pixel art) ─────────────────────────

export const BIOME_COLORS: Record<Biome, number> = {
  [Biome.Ocean]:    0x1a6b9e,
  [Biome.Beach]:    0xe8d89a,
  [Biome.Desert]:   0xd4a843,
  [Biome.Grassland]:0x5a9e4b,
  [Biome.Forest]:   0x2d6e2d,
  [Biome.Jungle]:   0x1a5c1a,
  [Biome.Swamp]:    0x4a6b3a,
  [Biome.Mountain]: 0x8a7a6a,
  [Biome.Snow]:     0xe8f0f8,
  [Biome.Volcano]:  0xc0402a,
  [Biome.Cave]:     0x3a3a3a,
  [Biome.River]:    0x3a8fc0,
};

// ─── Chunk generator ─────────────────────────────────────────

export class TerrainGenerator {
  constructor(private readonly seed: number) {}

  /** Generate a full chunk of tiles. O(CHUNK_SIZE²). */
  generateChunk(cx: number, cy: number): Chunk {
    const tiles: Tile[] = [];
    const baseX = cx * CHUNK_SIZE;
    const baseY = cy * CHUNK_SIZE;

    for (let ty = 0; ty < CHUNK_SIZE; ty++) {
      for (let tx = 0; tx < CHUNK_SIZE; tx++) {
        const wx = baseX + tx;
        const wy = baseY + ty;

        const elevation    = fbm(wx, wy, this.seed, 6);
        const moisture     = fbm(wx, wy, this.seed + 10000, 5);
        const tempNoise    = fbm(wx, wy, this.seed + 20000, 4);

        // Temperature: warmer at low elevation, equatorial (y=0 bias)
        const latitudeFactor = Math.abs(wy / 1000) % 1; // 0=equator, 1=pole
        const temperature = 30 - latitudeFactor * 60 - elevation * 20 + tempNoise * 10;

        const biome = classifyBiome(elevation, moisture, temperature);

        // Determine fertility based on biome and moisture
        const fertility =
          biome === Biome.Grassland || biome === Biome.Forest || biome === Biome.Jungle
            ? moisture * 0.8 + 0.1
            : moisture * 0.3;

        tiles.push({
          id: ty * CHUNK_SIZE + tx,
          x: wx,
          y: wy,
          biome,
          elevation,
          moisture,
          temperature,
          fertility,
          occupied: false,
        });
      }
    }

    return {
      id: `${cx},${cy}`,
      cx,
      cy,
      tiles,
      loaded: true,
      lastAccess: Date.now(),
    };
  }
}
