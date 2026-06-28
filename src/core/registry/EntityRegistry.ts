// ============================================================
// PIXEL EARTH — Entity Registry
// Central store for all living entities.
// Uses spatial partitioning for fast range queries.
// ============================================================

import type { BaseEntity, EntityId, Vec2, EntityType } from '../types';
import { CHUNK_SIZE } from '../types';

type ChunkKey = string;

function toChunkKey(cx: number, cy: number): ChunkKey {
  return `${cx},${cy}`;
}

function worldToChunk(pos: Vec2): { cx: number; cy: number } {
  return {
    cx: Math.floor(pos.x / CHUNK_SIZE),
    cy: Math.floor(pos.y / CHUNK_SIZE),
  };
}

export class EntityRegistry {
  /** All entities keyed by ID */
  private entities = new Map<EntityId, BaseEntity>();

  /** Spatial index: chunkKey → set of entity IDs */
  private spatialIndex = new Map<ChunkKey, Set<EntityId>>();

  /** Type index: entityType → set of IDs */
  private typeIndex = new Map<EntityType, Set<EntityId>>();

  // ─── CRUD ────────────────────────────────────────────────

  add(entity: BaseEntity): void {
    this.entities.set(entity.id, entity);
    this.indexSpatial(entity);
    this.indexType(entity);
  }

  get<T extends BaseEntity>(id: EntityId): T | undefined {
    return this.entities.get(id) as T | undefined;
  }

  update(entity: BaseEntity): void {
    const old = this.entities.get(entity.id);
    if (old) {
      this.removeSpatialIndex(old);
    }
    this.entities.set(entity.id, entity);
    this.indexSpatial(entity);
  }

  remove(id: EntityId): void {
    const entity = this.entities.get(id);
    if (!entity) return;
    this.removeSpatialIndex(entity);
    this.typeIndex.get(entity.type)?.delete(id);
    this.entities.delete(id);
  }

  has(id: EntityId): boolean {
    return this.entities.has(id);
  }

  get size(): number {
    return this.entities.size;
  }

  // ─── Queries ─────────────────────────────────────────────

  /** All entities as an iterable */
  all(): IterableIterator<BaseEntity> {
    return this.entities.values();
  }

  /** All entities of a given type */
  byType<T extends BaseEntity>(type: EntityType): T[] {
    const ids = this.typeIndex.get(type);
    if (!ids) return [];
    return [...ids]
      .map((id) => this.entities.get(id) as T)
      .filter(Boolean);
  }

  /** Entities in a specific chunk */
  inChunk(cx: number, cy: number): BaseEntity[] {
    const key = toChunkKey(cx, cy);
    const ids = this.spatialIndex.get(key);
    if (!ids) return [];
    return [...ids].map((id) => this.entities.get(id)!).filter(Boolean);
  }

  /**
   * Entities within a circular radius of a world position.
   * Uses chunk-level coarse filter then exact distance check.
   */
  inRadius(center: Vec2, radius: number): BaseEntity[] {
    const chunkRadius = Math.ceil(radius / CHUNK_SIZE) + 1;
    const { cx: ocx, cy: ocy } = worldToChunk(center);
    const results: BaseEntity[] = [];
    const r2 = radius * radius;

    for (let dx = -chunkRadius; dx <= chunkRadius; dx++) {
      for (let dy = -chunkRadius; dy <= chunkRadius; dy++) {
        const key = toChunkKey(ocx + dx, ocy + dy);
        const ids = this.spatialIndex.get(key);
        if (!ids) continue;
        for (const id of ids) {
          const e = this.entities.get(id);
          if (!e) continue;
          const distX = e.position.x - center.x;
          const distY = e.position.y - center.y;
          if (distX * distX + distY * distY <= r2) {
            results.push(e);
          }
        }
      }
    }
    return results;
  }

  /** Nearest entity of a given type to a position */
  nearest(pos: Vec2, type?: EntityType): BaseEntity | undefined {
    let nearest: BaseEntity | undefined;
    let minDist = Infinity;
    const source = type ? this.byType(type) : [...this.entities.values()];
    for (const e of source) {
      const dx = e.position.x - pos.x;
      const dy = e.position.y - pos.y;
      const d = dx * dx + dy * dy;
      if (d < minDist) {
        minDist = d;
        nearest = e;
      }
    }
    return nearest;
  }

  // ─── Private helpers ─────────────────────────────────────

  private indexSpatial(entity: BaseEntity): void {
    const { cx, cy } = worldToChunk(entity.position);
    const key = toChunkKey(cx, cy);
    if (!this.spatialIndex.has(key)) {
      this.spatialIndex.set(key, new Set());
    }
    this.spatialIndex.get(key)!.add(entity.id);
  }

  private removeSpatialIndex(entity: BaseEntity): void {
    const { cx, cy } = worldToChunk(entity.position);
    const key = toChunkKey(cx, cy);
    this.spatialIndex.get(key)?.delete(entity.id);
  }

  private indexType(entity: BaseEntity): void {
    if (!this.typeIndex.has(entity.type)) {
      this.typeIndex.set(entity.type, new Set());
    }
    this.typeIndex.get(entity.type)!.add(entity.id);
  }
}

// Singleton registry
export const entityRegistry = new EntityRegistry();
