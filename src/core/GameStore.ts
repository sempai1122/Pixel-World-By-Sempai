// ============================================================
// PIXEL EARTH — Game Store (Zustand)
// Reactive state for the UI layer.
// The engine writes to this store; React reads from it.
// ============================================================

import { create } from 'zustand';
import type { WorldTime, WeatherState, Human } from '../core/types';
import { GameSpeed, WeatherType } from '../core/types';

export interface SelectedEntityInfo {
  id: string;
  name: string;
  type: string;
  stats?: Human['stats'];
  job?: string;
  age?: number;
}

interface GameState {
  // Simulation
  speed: GameSpeed;
  tick: number;
  worldTime: WorldTime;
  isPaused: boolean;

  // World
  weather: WeatherState;
  loadedChunkCount: number;
  entityCount: number;

  // UI
  selectedEntity: SelectedEntityInfo | null;
  inspectorOpen: boolean;
  historyPanelOpen: boolean;
  minimapVisible: boolean;

  // Camera
  cameraX: number;
  cameraY: number;
  zoom: number;

  // History log (last 100 events)
  recentEvents: Array<{ id: string; text: string; time: string }>;

  // Actions
  setSpeed: (s: GameSpeed) => void;
  setTick: (t: number) => void;
  setWorldTime: (t: WorldTime) => void;
  setWeather: (w: WeatherState) => void;
  setLoadedChunkCount: (n: number) => void;
  setEntityCount: (n: number) => void;
  setSelectedEntity: (e: SelectedEntityInfo | null) => void;
  setInspectorOpen: (v: boolean) => void;
  setCameraPosition: (x: number, y: number) => void;
  setZoom: (z: number) => void;
  addEvent: (text: string, timeStr: string) => void;
  toggleHistoryPanel: () => void;
  toggleMinimap: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  speed: GameSpeed.Normal,
  tick: 0,
  worldTime: { tick: 0, second: 0, minute: 0, hour: 0, day: 0, month: 0, year: 0, century: 0 },
  isPaused: false,

  weather: {
    type: WeatherType.Clear,
    intensity: 0.3,
    windSpeed: 5,
    windDirection: 90,
    temperature: 20,
    humidity: 0.4,
    affectedChunks: [],
  },

  loadedChunkCount: 0,
  entityCount: 0,
  selectedEntity: null,
  inspectorOpen: false,
  historyPanelOpen: false,
  minimapVisible: true,
  cameraX: 0,
  cameraY: 0,
  zoom: 2,
  recentEvents: [],

  setSpeed: (speed) => set({ speed, isPaused: speed === GameSpeed.Paused }),
  setTick: (tick) => set({ tick }),
  setWorldTime: (worldTime) => set({ worldTime }),
  setWeather: (weather) => set({ weather }),
  setLoadedChunkCount: (loadedChunkCount) => set({ loadedChunkCount }),
  setEntityCount: (entityCount) => set({ entityCount }),
  setSelectedEntity: (selectedEntity) => set({ selectedEntity, inspectorOpen: !!selectedEntity }),
  setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
  setCameraPosition: (cameraX, cameraY) => set({ cameraX, cameraY }),
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(8, zoom)) }),
  addEvent: (text, time) =>
    set((s) => ({
      recentEvents: [
        { id: `${Date.now()}-${Math.random()}`, text, time },
        ...s.recentEvents,
      ].slice(0, 100),
    })),
  toggleHistoryPanel: () => set((s) => ({ historyPanelOpen: !s.historyPanelOpen })),
  toggleMinimap: () => set((s) => ({ minimapVisible: !s.minimapVisible })),
}));
