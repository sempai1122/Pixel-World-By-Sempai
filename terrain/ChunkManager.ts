// ============================================================
// PIXEL EARTH — Chunk Manager
// Manages which terrain chunks are loaded in memory.
// Loads chunks around the camera viewport, unloads distant ones.
// ============================================================

import type { System } from '../../core/engine/GameEngine';
import type { Chunk, Vec2 } from '../../core/types';
import { CHUNK_SIZE } from '../../core/types';
import { TerrainGenerator } from './TerrainGenerator';
import { eventBus } from '../../core/events/EventBus';

const LOAD_RADIUS_CHUNKS = 5;   // chunks to keep loaded around camera
const UNLOAD_RADIUS_CHUNKS = 8; // chunks beyond this are unloaded
const UNLOAD_CHECK_INTERVAL = 200; // ticks between unload sweeps

export class ChunkManager implements System {
  readonly name = 'ChunkManager';

  private chunks = new Map<string, Chunk>();
  private generator: TerrainGenerator;
  private cameraChunk: Vec2 = { x: 0, y: 0 };
  private lastUnloadCheck = 0;

  constructor(seed: number) {
    this.generator = new TerrainGenerator(seed);
  }

  init(): void {
    this.loadChunksAround(0, 0);
  }

  update(tick: number): void {
    // Periodically unload distant chunks to free memory
    if (tick - this.lastUnloadCheck > UNLOAD_CHECK_INTERVAL) {
      this.unloadDistantChunks();
      this.lastUnloadCheck = tick;
    }
  }

  // ─── Camera position ─────────────────────────────────────

  /** Called by the renderer when the viewport moves. */
  setCameraPosition(worldX: number, worldY: number): void {
    const cx = Math.floor(worldX / CHUNK_SIZE);
    const cy = Math.floor(worldY / CHUNK_SIZE);

    if (cx !== this.cameraChunk.x || cy !== this.cameraChunk.y) {
      this.cameraChunk = { x: cx, y: cy };
      this.loadChunksAround(cx, cy);
    }
  }

  // ─── Chunk access ─────────────────────────────────────────

  getChunk(cx: number, cy: number): Chunk {
    const id = `${cx},${cy}`;
    if (!this.chunks.has(id)) {
      this.loadChunk(cx, cy);
    }
    const chunk = this.chunks.get(id)!;
    chunk.lastAccess = Date.now();
    return chunk;
  }

  /** Get the tile at an absolute world position. */
  getTileAt(wx: number, wy: number) {
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cy = Math.floor(wy / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cy);
    const lx = wx - cx * CHUNK_SIZE;
    const ly = wy - cy * CHUNK_SIZE;
    return chunk.tiles[ly * CHUNK_SIZE + lx];
  }

  get loadedChunks(): Chunk[] {
    return [...this.chunks.values()];
  }

  get loadedCount(): number {
    return this.chunks.size;
  }

  // ─── Private ─────────────────────────────────────────────

  private loadChunksAround(cx: number, cy: number): void {
    for (let dx = -LOAD_RADIUS_CHUNKS; dx <= LOAD_RADIUS_CHUNKS; dx++) {
      for (let dy = -LOAD_RADIUS_CHUNKS; dy <= LOAD_RADIUS_CHUNKS; dy++) {
        this.loadChunk(cx + dx, cy + dy);
      }
    }
  }

  private loadChunk(cx: number, cy: number): void {
    const id = `${cx},${cy}`;
    if (this.chunks.has(id)) return;
    const chunk = this.generator.generateChunk(cx, cy);
    this.chunks.set(id, chunk);
    eventBus.emit('world:chunkLoaded', { chunkId: id });
  }

  private unloadDistantChunks(): void {
    const { x: ccx, y: ccy } = this.cameraChunk;
    for (const [id, chunk] of this.chunks) {
      const dx = Math.abs(chunk.cx - ccx);
      const dy = Math.abs(chunk.cy - ccy);
      if (dx > UNLOAD_RADIUS_CHUNKS || dy > UNLOAD_RADIUS_CHUNKS) {
        this.chunks.delete(id);
        eventBus.emit('world:chunkUnloaded', { chunkId: id });
      }
    }
  }
}
