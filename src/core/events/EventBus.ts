// ============================================================
// PIXEL EARTH — Event Bus
// Central pub/sub system for all engine events.
// Supports mod hooks via named event channels.
// ============================================================

export type EventPayload = Record<string, unknown>;
export type EventListener<T extends EventPayload = EventPayload> = (payload: T) => void;

export interface PixelEarthEvents {
  // Entity lifecycle
  'entity:spawn':     { entityId: string; type: string };
  'entity:destroy':   { entityId: string };

  // Human lifecycle
  'human:born':       { entityId: string; name: string; parentIds: string[] };
  'human:died':       { entityId: string; name: string; cause: string };
  'human:married':    { entityId1: string; entityId2: string };
  'human:levelUp':    { entityId: string; skill: string; level: number };

  // World
  'world:chunkLoaded':   { chunkId: string };
  'world:chunkUnloaded': { chunkId: string };
  'world:tick':          { tick: number };

  // Weather
  'weather:changed':     { previous: string; current: string; intensity: number };
  'weather:disaster':    { type: string; affectedChunks: string[] };

  // Politics
  'politics:electionFinished': { nationId: string; winnerId: string; votes: number };
  'politics:warStarted':       { attacker: string; defender: string };
  'politics:warEnded':         { nations: string[]; treatyType: string };
  'politics:revolutionStarted':{ nationId: string; leaderId: string };
  'politics:governmentCollapsed': { nationId: string };

  // Economy
  'economy:crash':    { nationId: string; gdpLoss: number };
  'economy:boom':     { nationId: string; gdpGain: number };

  // Simulation
  'sim:paused':       Record<string, never>;
  'sim:resumed':      { speed: number };
  'sim:speedChanged': { speed: number };

  // Save
  'save:completed':   { slot: string; timestamp: number };
  'save:loaded':      { slot: string };
}

type EventMap = PixelEarthEvents;
type EventName = keyof EventMap;

class EventBus {
  private listeners = new Map<EventName, Set<EventListener>>();

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   */
  on<K extends EventName>(event: K, listener: EventListener<EventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(listener as EventListener);
    return () => set.delete(listener as EventListener);
  }

  /**
   * Subscribe to an event once, then auto-unsubscribe.
   */
  once<K extends EventName>(event: K, listener: EventListener<EventMap[K]>): void {
    const unsub = this.on(event, (payload) => {
      listener(payload as EventMap[K]);
      unsub();
    });
  }

  /**
   * Emit an event to all subscribers.
   */
  emit<K extends EventName>(event: K, payload: EventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of set) {
      try {
        listener(payload as EventPayload);
      } catch (err) {
        console.error(`[EventBus] Error in listener for "${event}":`, err);
      }
    }
  }

  /**
   * Remove all listeners for an event (or all events).
   */
  clear(event?: EventName): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Returns the number of listeners for an event (debug utility).
   */
  listenerCount(event: EventName): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

// Singleton event bus — shared across the entire engine
export const eventBus = new EventBus();
