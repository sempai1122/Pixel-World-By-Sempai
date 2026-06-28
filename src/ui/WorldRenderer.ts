// ============================================================
// PIXEL EARTH — World Renderer (PixiJS)
// Renders terrain chunks and entities as pixel art.
// Handles camera panning and zoom.
// ============================================================

import * as PIXI from 'pixi.js';
import type { ChunkManager } from '../world/terrain/ChunkManager';
import type { Chunk, Tile } from '../core/types';
import { EntityType } from '../core/types';
import type { Human } from '../core/types';
import { entityRegistry } from '../core/registry/EntityRegistry';
import { BIOME_COLORS } from '../world/terrain/TerrainGenerator';
import { CHUNK_SIZE } from '../core/types';

const TILE_SIZE = 8; // pixels per tile

export interface RendererOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  chunkManager: ChunkManager;
}

export class WorldRenderer {
  private app: PIXI.Application;
  private worldContainer: PIXI.Container;
  private chunkSprites = new Map<string, PIXI.Container>();
  private entityLayer: PIXI.Container;
  private chunkManager: ChunkManager;

  // Camera state
  private camX = 0;
  private camY = 0;
  private zoom = 2;

  // Interaction
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };
  private camStart  = { x: 0, y: 0 };

  constructor(opts: RendererOptions) {
    this.chunkManager = opts.chunkManager;

    this.app = new PIXI.Application({
      view: opts.canvas,
      width: opts.width,
      height: opts.height,
      backgroundColor: 0x0a0a0f,
      antialias: false,
      resolution: window.devicePixelRatio || 1,
    });

    this.worldContainer = new PIXI.Container();
    this.entityLayer    = new PIXI.Container();
    this.worldContainer.addChild(this.entityLayer);
    this.app.stage.addChild(this.worldContainer);

    this.setupInteraction(opts.canvas);
    this.app.ticker.add(this.render.bind(this));
  }

  // ─── Public API ─────────────────────────────────────────────

  setCamera(x: number, y: number, zoom?: number): void {
    this.camX = x;
    this.camY = y;
    if (zoom !== undefined) this.zoom = zoom;
  }

  getCamera(): { x: number; y: number; zoom: number } {
    return { x: this.camX, y: this.camY, zoom: this.zoom };
  }

  resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
  }

  destroy(): void {
    this.app.destroy(false, { children: true });
  }

  // ─── Main render loop ────────────────────────────────────────

  private render(): void {
    // Update chunk manager with current camera position
    const tileX = Math.floor(this.camX / TILE_SIZE);
    const tileY = Math.floor(this.camY / TILE_SIZE);
    this.chunkManager.setCameraPosition(tileX, tileY);

    // Apply camera transform
    this.worldContainer.x = -this.camX * this.zoom + this.app.renderer.width / 2;
    this.worldContainer.y = -this.camY * this.zoom + this.app.renderer.height / 2;
    this.worldContainer.scale.set(this.zoom);

    // Render all loaded chunks
    this.renderChunks();

    // Render entities
    this.renderEntities();
  }

  private renderChunks(): void {
    const loadedChunks = this.chunkManager.loadedChunks;
    const seen = new Set<string>();

    for (const chunk of loadedChunks) {
      seen.add(chunk.id);
      if (!this.chunkSprites.has(chunk.id)) {
        this.buildChunkSprite(chunk);
      }
    }

    // Remove unloaded chunk sprites
    for (const [id, sprite] of this.chunkSprites) {
      if (!seen.has(id)) {
        this.worldContainer.removeChild(sprite);
        sprite.destroy({ children: true });
        this.chunkSprites.delete(id);
      }
    }
  }

  private buildChunkSprite(chunk: Chunk): void {
    const container = new PIXI.Container();
    const chunkPixelSize = CHUNK_SIZE * TILE_SIZE;

    // Use a Graphics object for pixel-perfect tile rendering
    const gfx = new PIXI.Graphics();

    for (const tile of chunk.tiles) {
      const lx = (tile.x - chunk.cx * CHUNK_SIZE) * TILE_SIZE;
      const ly = (tile.y - chunk.cy * CHUNK_SIZE) * TILE_SIZE;
      const color = this.getTileColor(tile);

      gfx.beginFill(color);
      gfx.drawRect(lx, ly, TILE_SIZE, TILE_SIZE);
      gfx.endFill();
    }

    container.addChild(gfx);
    container.x = chunk.cx * chunkPixelSize;
    container.y = chunk.cy * chunkPixelSize;

    this.worldContainer.addChildAt(container, 0);
    this.chunkSprites.set(chunk.id, container);
  }

  private getTileColor(tile: Tile): number {
    const base = BIOME_COLORS[tile.biome];
    // Slight elevation shading
    const shade = 0.8 + tile.elevation * 0.4;
    return this.shadeColor(base, shade);
  }

  private shadeColor(color: number, factor: number): number {
    const r = Math.min(255, ((color >> 16) & 0xff) * factor);
    const g = Math.min(255, ((color >> 8)  & 0xff) * factor);
    const b = Math.min(255, ( color        & 0xff) * factor);
    return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
  }

  private renderEntities(): void {
    // Clear and redraw entities each frame (simple approach for Phase 1)
    this.entityLayer.removeChildren();

    const humans = entityRegistry.byType<Human>(EntityType.Human);
    for (const human of humans) {
      const dot = new PIXI.Graphics();
      dot.beginFill(0xffdd44);
      dot.drawCircle(0, 0, 3);
      dot.endFill();
      dot.x = human.position.x * TILE_SIZE;
      dot.y = human.position.y * TILE_SIZE;
      this.entityLayer.addChild(dot);
    }
  }

  // ─── Interaction (pan + zoom) ────────────────────────────────

  private setupInteraction(canvas: HTMLCanvasElement): void {
    // Mouse drag to pan
    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStart  = { x: e.clientX, y: e.clientY };
      this.camStart   = { x: this.camX, y: this.camY };
      canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = (e.clientX - this.dragStart.x) / this.zoom;
      const dy = (e.clientY - this.dragStart.y) / this.zoom;
      this.camX = this.camStart.x - dx;
      this.camY = this.camStart.y - dy;
    });

    canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
      canvas.style.cursor = 'crosshair';
    });

    // Scroll to zoom
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.2 : 0.2;
      this.zoom = Math.max(0.5, Math.min(8, this.zoom + delta));
    }, { passive: false });

    // Touch drag (mobile)
    let lastTouch: Touch | null = null;
    canvas.addEventListener('touchstart', (e) => {
      lastTouch = e.touches[0];
      this.camStart = { x: this.camX, y: this.camY };
    });
    canvas.addEventListener('touchmove', (e) => {
      if (!lastTouch) return;
      const t   = e.touches[0];
      const dx  = (t.clientX - lastTouch.clientX) / this.zoom;
      const dy  = (t.clientY - lastTouch.clientY) / this.zoom;
      this.camX -= dx;
      this.camY -= dy;
      lastTouch = t;
    });
  }
}
