// ============================================================
// PIXEL EARTH — Save System
// Persists world state using IndexedDB.
// Supports: autosave, manual save, export JSON, import JSON.
// ============================================================

import { openDB, type IDBPDatabase } from 'idb';
import type { SaveState } from '../core/types';
import { eventBus } from '../core/events/EventBus';

const DB_NAME    = 'PixelEarthDB';
const DB_VERSION = 1;
const STORE_SAVES = 'saves';
const AUTOSAVE_SLOT = 'autosave';

interface SaveMeta {
  slot: string;
  timestamp: number;
  worldYear: number;
  entityCount: number;
  thumbnail?: string;
}

class SaveSystem {
  private db: IDBPDatabase | null = null;
  private autosaveIntervalId: ReturnType<typeof setInterval> | null = null;

  /** Must be called before any other method. */
  async init(): Promise<void> {
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_SAVES)) {
          db.createObjectStore(STORE_SAVES, { keyPath: 'slot' });
        }
      },
    });
  }

  /** Save to a named slot. */
  async save(state: SaveState, slot = 'save_1'): Promise<void> {
    if (!this.db) throw new Error('SaveSystem not initialized');

    const entry = {
      slot,
      state,
      timestamp: Date.now(),
      worldYear: state.worldTime.year,
      entityCount: state.entities.length,
    };

    await this.db.put(STORE_SAVES, entry);
    eventBus.emit('save:completed', { slot, timestamp: entry.timestamp });
    console.info(`[SaveSystem] Saved to slot "${slot}"`);
  }

  /** Load from a named slot. Returns null if not found. */
  async load(slot: string): Promise<SaveState | null> {
    if (!this.db) throw new Error('SaveSystem not initialized');

    const entry = await this.db.get(STORE_SAVES, slot);
    if (!entry) return null;

    eventBus.emit('save:loaded', { slot });
    console.info(`[SaveSystem] Loaded from slot "${slot}"`);
    return entry.state as SaveState;
  }

  /** List all save slots with metadata. */
  async listSaves(): Promise<SaveMeta[]> {
    if (!this.db) return [];
    const all = await this.db.getAll(STORE_SAVES);
    return all.map(({ slot, timestamp, worldYear, entityCount }) => ({
      slot,
      timestamp,
      worldYear,
      entityCount,
    }));
  }

  /** Delete a save slot. */
  async deleteSave(slot: string): Promise<void> {
    if (!this.db) return;
    await this.db.delete(STORE_SAVES, slot);
    console.info(`[SaveSystem] Deleted slot "${slot}"`);
  }

  /** Start autosaving every N milliseconds. */
  startAutosave(getState: () => SaveState, intervalMs = 60_000): void {
    this.stopAutosave();
    this.autosaveIntervalId = setInterval(async () => {
      await this.save(getState(), AUTOSAVE_SLOT);
    }, intervalMs);
  }

  stopAutosave(): void {
    if (this.autosaveIntervalId !== null) {
      clearInterval(this.autosaveIntervalId);
      this.autosaveIntervalId = null;
    }
  }

  /** Export current save as a downloadable JSON file. */
  exportJSON(state: SaveState, filename = 'pixel-earth-save.json'): void {
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Import a save from a JSON file chosen by the user. */
  async importJSON(): Promise<SaveState | null> {
    return new Promise((resolve) => {
      const input       = document.createElement('input');
      input.type        = 'file';
      input.accept      = '.json';
      input.onchange    = async () => {
        const file = input.files?.[0];
        if (!file) { resolve(null); return; }
        const text  = await file.text();
        const state = JSON.parse(text) as SaveState;
        resolve(state);
      };
      input.click();
    });
  }
}

export const saveSystem = new SaveSystem();
