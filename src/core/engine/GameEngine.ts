// ============================================================
// PIXEL EARTH — Game Engine
// The central simulation loop. Manages all systems,
// controls tick rate, and coordinates updates.
// ============================================================

import { eventBus } from '../events/EventBus';
import { entityRegistry } from '../registry/EntityRegistry';
import type { GameSpeed } from '../types';

export interface System {
  /** Human-readable name (for debugging) */
  readonly name: string;
  /** Called once during engine initialization */
  init?(): void;
  /** Called every simulation tick */
  update(tick: number, deltaMs: number): void;
  /** Called when the engine is destroyed */
  destroy?(): void;
}

const TICKS_PER_SECOND_BASE = 20; // Real-time ticks per second at speed=1
const MS_PER_TICK_BASE = 1000 / TICKS_PER_SECOND_BASE;

export class GameEngine {
  private systems: System[] = [];
  private speed: GameSpeed = 0 as GameSpeed;
  private tick = 0;
  private rafHandle: number | null = null;
  private lastTime: number | null = null;
  private accumulator = 0;
  private running = false;
  private initialized = false;

  // ─── Lifecycle ───────────────────────────────────────────

  /** Register a system to receive update calls. Order matters. */
  registerSystem(system: System): this {
    this.systems.push(system);
    if (this.initialized) {
      system.init?.();
    }
    return this;
  }

  /** Initialize all systems and prepare the engine. */
  init(): void {
    if (this.initialized) return;
    console.info('[Engine] Initializing Pixel Earth engine...');
    for (const system of this.systems) {
      try {
        system.init?.();
      } catch (err) {
        console.error(`[Engine] Error initializing system "${system.name}":`, err);
      }
    }
    this.initialized = true;
    console.info(`[Engine] Initialized ${this.systems.length} systems.`);
  }

  /** Start the simulation. */
  start(speed: GameSpeed = 1 as GameSpeed): void {
    if (this.running) return;
    this.speed = speed;
    this.running = true;
    this.lastTime = null;
    this.loop();
    eventBus.emit('sim:resumed', { speed: this.speed });
    console.info(`[Engine] Started at speed ${this.speed}.`);
  }

  /** Pause the simulation. */
  pause(): void {
    if (!this.running) return;
    this.running = false;
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
    eventBus.emit('sim:paused', {});
  }

  /** Resume after pause. */
  resume(): void {
    if (this.running) return;
    this.start(this.speed);
  }

  /** Change simulation speed. */
  setSpeed(speed: GameSpeed): void {
    this.speed = speed;
    if (speed === 0) {
      this.pause();
    } else if (!this.running) {
      this.start(speed);
    }
    eventBus.emit('sim:speedChanged', { speed });
  }

  getSpeed(): GameSpeed {
    return this.speed;
  }

  getTick(): number {
    return this.tick;
  }

  isRunning(): boolean {
    return this.running;
  }

  /** Tear down the engine and free resources. */
  destroy(): void {
    this.pause();
    for (const system of this.systems) {
      try {
        system.destroy?.();
      } catch (err) {
        console.error(`[Engine] Error destroying system "${system.name}":`, err);
      }
    }
    this.systems = [];
    eventBus.clear();
    entityRegistry['entities'].clear();
  }

  // ─── Private loop ────────────────────────────────────────

  private loop(): void {
    if (!this.running) return;

    this.rafHandle = requestAnimationFrame((now) => {
      if (this.lastTime === null) {
        this.lastTime = now;
      }

      const realDeltaMs = now - this.lastTime;
      this.lastTime = now;

      // Scale delta by speed multiplier
      const simDeltaMs = realDeltaMs * this.speed;
      this.accumulator += simDeltaMs;

      const msPerTick = MS_PER_TICK_BASE;

      // Run as many ticks as accumulated, capped to avoid spiral of death
      let ticksThisFrame = 0;
      const MAX_TICKS_PER_FRAME = 20;

      while (this.accumulator >= msPerTick && ticksThisFrame < MAX_TICKS_PER_FRAME) {
        this.accumulator -= msPerTick;
        this.tick++;
        ticksThisFrame++;
        this.runTick(msPerTick);
      }

      this.loop();
    });
  }

  private runTick(deltaMs: number): void {
    for (const system of this.systems) {
      try {
        system.update(this.tick, deltaMs);
      } catch (err) {
        console.error(`[Engine] Error in system "${system.name}" at tick ${this.tick}:`, err);
      }
    }
    eventBus.emit('world:tick', { tick: this.tick });
  }
}

// Singleton engine instance
export const engine = new GameEngine();
