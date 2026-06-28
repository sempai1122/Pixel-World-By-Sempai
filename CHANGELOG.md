# Changelog

All notable changes to Pixel Earth are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.1.0] — Phase 1: Foundation

### Added

- `GameEngine` — main simulation loop with configurable speed (pause, normal, fast, faster, ultra)
- `EventBus` — typed pub/sub event system with full TypeScript inference
- `EntityRegistry` — spatial index supporting chunk-based queries and radius searches
- `TerrainGenerator` — deterministic procedural world using layered fractional Brownian motion (fBm)
- `ChunkManager` — dynamic chunk loading/unloading around the camera viewport
- `TimeSystem` — tick-to-time conversion: seconds → minutes → hours → days → months → years → centuries
- `WeatherSystem` — Markov-chain weather transitions with disaster events
- `HumanAISystem` — autonomous humans with needs (hunger, thirst, energy), goals, jobs, money, memories
- `WorldRenderer` — PixiJS pixel-art renderer with camera pan and scroll-to-zoom
- `SaveSystem` — IndexedDB persistence with autosave, manual save, export/import JSON
- `ModAPI` + `ModRegistry` — full plugin system with event hooks and custom systems
- `GameStore` — Zustand reactive store bridging engine state to React UI
- `HUD` — pixel-art HUD with time display, weather, entity count, speed controls, god powers
- `NameGenerator` — procedural human name generation
- Core TypeScript types: all entities, biomes, weather, history events, save state

### Architecture

- SOLID modular architecture
- All systems implement the `System` interface
- No hardcoded content — everything is data-driven
- Mod-ready from day one
