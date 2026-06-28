// ============================================================
// PIXEL EARTH — Mod API
// Public API surface for mod authors.
// Mods register here to hook into events, add systems, etc.
// ============================================================

import { eventBus } from '../../core/events/EventBus';
import type { PixelEarthEvents } from '../../core/events/EventBus';
import { engine } from '../../core/engine/GameEngine';
import type { System } from '../../core/engine/GameEngine';
import { entityRegistry } from '../../core/registry/EntityRegistry';
import type { BaseEntity, EntityId } from '../../core/types';

export interface ModManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  dependencies?: string[];
}

export interface Mod {
  manifest: ModManifest;
  /** Called when the mod is loaded. Use to register hooks, systems, etc. */
  onLoad(api: ModAPI): void;
  /** Called when the mod is unloaded. Clean up resources. */
  onUnload?(): void;
}

/** The API surface exposed to mod authors. */
export class ModAPI {
  private cleanupCallbacks: Array<() => void> = [];

  constructor(private readonly modId: string) {}

  /** Subscribe to a world event. Automatically unsubscribed on mod unload. */
  on<K extends keyof PixelEarthEvents>(
    event: K,
    callback: (payload: PixelEarthEvents[K]) => void
  ): void {
    const unsub = eventBus.on(event, callback as () => void);
    this.cleanupCallbacks.push(unsub);
  }

  /** Register a custom system with the engine. */
  addSystem(system: System): void {
    engine.registerSystem(system);
    console.info(`[Mod:${this.modId}] Registered system "${system.name}"`);
  }

  /** Spawn an entity into the world. */
  spawnEntity(entity: BaseEntity): void {
    entityRegistry.add(entity);
  }

  /** Remove an entity from the world. */
  removeEntity(id: EntityId): void {
    entityRegistry.remove(id);
  }

  /** Get an entity by ID. */
  getEntity<T extends BaseEntity>(id: EntityId): T | undefined {
    return entityRegistry.get<T>(id);
  }

  /** Emit a custom event (must be a known event type). */
  emit<K extends keyof PixelEarthEvents>(event: K, payload: PixelEarthEvents[K]): void {
    eventBus.emit(event, payload);
  }

  /** Called internally when mod is unloaded — runs cleanup. */
  _cleanup(): void {
    for (const fn of this.cleanupCallbacks) fn();
    this.cleanupCallbacks = [];
  }
}

// ─── Mod Registry ─────────────────────────────────────────────

class ModRegistry {
  private mods = new Map<string, { mod: Mod; api: ModAPI }>();

  load(mod: Mod): void {
    if (this.mods.has(mod.manifest.id)) {
      console.warn(`[ModRegistry] Mod "${mod.manifest.id}" is already loaded.`);
      return;
    }
    const api = new ModAPI(mod.manifest.id);
    try {
      mod.onLoad(api);
      this.mods.set(mod.manifest.id, { mod, api });
      console.info(`[ModRegistry] Loaded mod: ${mod.manifest.name} v${mod.manifest.version}`);
    } catch (err) {
      console.error(`[ModRegistry] Failed to load mod "${mod.manifest.id}":`, err);
      api._cleanup();
    }
  }

  unload(modId: string): void {
    const entry = this.mods.get(modId);
    if (!entry) return;
    entry.mod.onUnload?.();
    entry.api._cleanup();
    this.mods.delete(modId);
    console.info(`[ModRegistry] Unloaded mod: ${modId}`);
  }

  getLoaded(): ModManifest[] {
    return [...this.mods.values()].map(({ mod }) => mod.manifest);
  }
}

export const modRegistry = new ModRegistry();
