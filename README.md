# 🌍 Pixel Earth

> An open-source, browser-based pixel civilization simulator.

Pixel Earth is **not a game**. It is a living digital world where everything is simulated: every human, animal, plant, city, government, business, weather event, and ecosystem exists independently and continuously evolves — all rendered as pixel art in your browser.

The player is a **god-like observer**, not a character.

![Pixel Earth Screenshot](docs/screenshot.png)

---

## ✨ Features (Phase 1)

- **Infinite procedural world** — biomes generated via fractional Brownian motion (oceans, forests, deserts, mountains, snow, volcanoes, swamps, jungles and more)
- **Living humans** — autonomous AI agents with needs (hunger, thirst, energy), goals, jobs, money, memories and relationships
- **Dynamic weather** — clear, rain, storm, snow, fog, lightning, flood, drought, wildfire, earthquake, heatwave, blizzard with natural transitions
- **World time** — seconds → minutes → hours → days → months → years → centuries, everything changes naturally
- **God powers** — spawn humans, change weather, control simulation speed
- **Mod API** — fully data-driven; register custom systems, hook into events, add entities
- **IndexedDB save system** — autosave, manual save, export/import JSON
- **History system** — every birth, death, and disaster is recorded
- **PixiJS rendering** — pixel-perfect rendering at 60fps with camera pan and zoom
- **Performance** — chunk loading, spatial partitioning, entity pooling

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
git clone https://github.com/yourusername/pixel-earth.git
cd pixel-earth
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for production

```bash
npm run build
npm run preview
```

---

## 🏗️ Architecture

```
src/
├── core/
│   ├── engine/        # GameEngine — main simulation loop
│   ├── events/        # EventBus — pub/sub event system
│   ├── registry/      # EntityRegistry — spatial partitioning
│   ├── types.ts       # All core TypeScript types
│   └── GameStore.ts   # Zustand reactive state for UI
│
├── world/
│   ├── terrain/       # TerrainGenerator + ChunkManager
│   ├── weather/       # WeatherSystem
│   └── time/          # TimeSystem
│
├── entities/
│   ├── human/         # HumanAISystem
│   ├── animal/        # (Phase 3)
│   └── plant/         # (Phase 3)
│
├── systems/
│   ├── economy/       # (Phase 5)
│   ├── politics/      # (Phase 6)
│   ├── health/        # (Phase 7)
│   ├── education/     # (Phase 7)
│   └── transport/     # (Phase 7)
│
├── ui/
│   ├── hud/           # Heads-up display
│   ├── panels/        # Inspector, history panels
│   └── WorldRenderer.ts  # PixiJS renderer
│
├── mods/
│   └── api/           # ModAPI + ModRegistry
│
└── utils/
    ├── NameGenerator.ts
    └── SaveSystem.ts
```

### Key design principles

- **SOLID** — each class has one job; systems are injected into the engine
- **Data-driven** — no hardcoded content; everything is driven by typed configuration
- **Event-driven** — systems communicate via `EventBus`, not direct references
- **Modular** — every system can be replaced or extended by a mod
- **Performant** — chunk loading keeps memory bounded; spatial index enables O(1) proximity queries

---

## 🔌 Mod API

```typescript
import type { Mod, ModAPI } from './src/mods/api/ModAPI';

const myMod: Mod = {
  manifest: {
    id: 'my-mod',
    name: 'My First Mod',
    version: '1.0.0',
    author: 'You',
    description: 'Does cool things',
  },
  onLoad(api: ModAPI) {
    // Hook into engine events
    api.on('human:born', ({ name }) => {
      console.log(`Welcome, ${name}!`);
    });

    // Register a custom system
    api.addSystem({
      name: 'MyCustomSystem',
      update(tick) {
        if (tick % 100 === 0) console.log('Custom tick!');
      },
    });
  },
};

// Load your mod
modRegistry.load(myMod);
```

### Available event hooks

| Event | Payload |
|-------|---------|
| `human:born` | `{ entityId, name, parentIds }` |
| `human:died` | `{ entityId, name, cause }` |
| `human:married` | `{ entityId1, entityId2 }` |
| `weather:changed` | `{ previous, current, intensity }` |
| `weather:disaster` | `{ type, affectedChunks }` |
| `politics:electionFinished` | `{ nationId, winnerId, votes }` |
| `politics:warStarted` | `{ attacker, defender }` |
| `politics:revolutionStarted` | `{ nationId, leaderId }` |
| `world:tick` | `{ tick }` |
| `world:chunkLoaded` | `{ chunkId }` |

---

## 🗺️ Development Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| 1 — Foundation | ✅ **Complete** | Engine, world gen, human AI, weather, renderer, save system |
| 2 — World Engine | 🔜 Next | Rivers, roads, cities, villages, resource distribution |
| 3 — Entity Engine | ⏳ Planned | Animals, plants, decay, ecosystem simulation |
| 4 — Human AI | ⏳ Planned | Deep relationships, crime, voting, marriage, children |
| 5 — Economy | ⏳ Planned | Currency, businesses, banks, supply & demand, stock market |
| 6 — Politics | ⏳ Planned | Nations, governments, elections, military, diplomacy |
| 7 — Society | ⏳ Planned | Education, healthcare, transport, religion |
| 8 — Revolution & War | ⏳ Planned | Protests, coups, civil wars, battles, peace treaties |
| 9 — Technology | ⏳ Planned | Research, tech tree, industrial revolution |
| 10 — Polish | ⏳ Planned | Performance optimization, mobile, multiplayer-ready |

---

## 🛠️ Tech Stack

| Technology | Role |
|------------|------|
| React 18 + TypeScript | UI framework |
| Vite | Build tool |
| PixiJS 7 | WebGL pixel-art renderer |
| Zustand | Reactive state management |
| IndexedDB (idb) | Persistent save system |
| Web Workers | Off-thread simulation (Phase 10) |

---

## 🤝 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

```bash
# Run type checking
npm run type-check

# Run linter
npm run lint

# Run tests
npm test
```

---

## 📜 License

[MIT](LICENSE) — free for personal and commercial use.

---

## 🌟 Acknowledgements

Built with ❤️ by the Pixel Earth community.
