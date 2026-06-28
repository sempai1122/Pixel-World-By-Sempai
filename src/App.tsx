// ============================================================
// PIXEL EARTH — App Root
// Wires the engine, renderer, and React UI together.
// ============================================================

import { useEffect, useRef } from 'react';
import { engine } from './core/engine/GameEngine';
import { ChunkManager } from './world/terrain/ChunkManager';
import { timeSystem } from './world/time/TimeSystem';
import { weatherSystem } from './world/weather/WeatherSystem';
import { humanAISystem } from './entities/human/HumanAISystem';
import { WorldRenderer } from './ui/WorldRenderer';
import { saveSystem } from './utils/SaveSystem';
import { eventBus } from './core/events/EventBus';
import { entityRegistry } from './core/registry/EntityRegistry';
import { useGameStore } from './core/GameStore';
import { GameSpeed } from './core/types';
import { HUD } from './ui/hud/HUD';
import styles from './App.module.css';

const WORLD_SEED = 42;

export default function App() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WorldRenderer | null>(null);
  const chunkMgrRef = useRef<ChunkManager | null>(null);

  const { setWorldTime, setWeather, setEntityCount, setLoadedChunkCount, addEvent } = useGameStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    // ── Init systems ──────────────────────────────────────────
    const chunkManager = new ChunkManager(WORLD_SEED);
    chunkMgrRef.current = chunkManager;

    engine
      .registerSystem(chunkManager)
      .registerSystem(timeSystem)
      .registerSystem(weatherSystem)
      .registerSystem(humanAISystem);

    engine.init();

    // ── Init renderer ────────────────────────────────────────
    const canvas = canvasRef.current;
    const renderer = new WorldRenderer({
      canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      chunkManager,
    });
    rendererRef.current = renderer;

    // ── Init save system ──────────────────────────────────────
    saveSystem.init().catch(console.error);

    // ── Wire events → UI store ────────────────────────────────
    const unsubs = [
      eventBus.on('world:tick', ({ tick }) => {
        // Update UI at most 10× per second (every 2 ticks at normal speed)
        if (tick % 2 !== 0) return;
        setWorldTime(timeSystem.time);
        setEntityCount(entityRegistry.size);
        setLoadedChunkCount(chunkManager.loadedCount);
      }),

      eventBus.on('weather:changed', ({ current, intensity }) => {
        setWeather({ ...weatherSystem.current });
        addEvent(`Weather changed to ${current} (${Math.round(intensity * 100)}%)`, timeSystem.formatted);
      }),

      eventBus.on('weather:disaster', ({ type }) => {
        addEvent(`⚠️ Disaster: ${type}!`, timeSystem.formatted);
      }),

      eventBus.on('human:born', ({ name }) => {
        addEvent(`👶 ${name} was born`, timeSystem.formatted);
      }),

      eventBus.on('human:died', ({ name, cause }) => {
        addEvent(`💀 ${name} died (${cause})`, timeSystem.formatted);
      }),
    ];

    // ── Spawn initial population ──────────────────────────────
    for (let i = 0; i < 20; i++) {
      humanAISystem.spawnHuman(
        (Math.random() - 0.5) * 60 + 16,
        (Math.random() - 0.5) * 60 + 16
      );
    }

    // ── Start engine ──────────────────────────────────────────
    engine.start(GameSpeed.Normal);

    // ── Handle resize ─────────────────────────────────────────
    const handleResize = () => {
      renderer.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      engine.pause();
      renderer.destroy();
      for (const unsub of unsubs) unsub();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className={styles.app}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <HUD />
    </div>
  );
}
