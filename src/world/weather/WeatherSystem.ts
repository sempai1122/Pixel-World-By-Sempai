// ============================================================
// PIXEL EARTH — Weather System
// Simulates dynamic weather patterns that evolve over time.
// Weather affects gameplay: crops, health, travel, wildlife.
// ============================================================

import type { System } from '../../core/engine/GameEngine';
import { WeatherType } from '../../core/types';
import type { WeatherState } from '../../core/types';
import { eventBus } from '../../core/events/EventBus';

const WEATHER_CHANGE_INTERVAL = 2000; // ticks between possible changes
const DISASTER_CHANCE = 0.02;          // 2% per weather change event

interface WeatherTransition {
  to: WeatherType;
  weight: number; // relative probability
}

const TRANSITIONS: Record<WeatherType, WeatherTransition[]> = {
  [WeatherType.Clear]: [
    { to: WeatherType.Clear, weight: 50 },
    { to: WeatherType.Rain, weight: 25 },
    { to: WeatherType.Fog, weight: 10 },
    { to: WeatherType.Storm, weight: 8 },
    { to: WeatherType.Heatwave, weight: 5 },
    { to: WeatherType.Drought, weight: 2 },
  ],
  [WeatherType.Rain]: [
    { to: WeatherType.Rain, weight: 40 },
    { to: WeatherType.Clear, weight: 35 },
    { to: WeatherType.Storm, weight: 15 },
    { to: WeatherType.Flood, weight: 5 },
    { to: WeatherType.Fog, weight: 5 },
  ],
  [WeatherType.Storm]: [
    { to: WeatherType.Storm, weight: 30 },
    { to: WeatherType.Rain, weight: 40 },
    { to: WeatherType.Lightning, weight: 15 },
    { to: WeatherType.Flood, weight: 10 },
    { to: WeatherType.Clear, weight: 5 },
  ],
  [WeatherType.Snow]: [
    { to: WeatherType.Snow, weight: 50 },
    { to: WeatherType.Blizzard, weight: 20 },
    { to: WeatherType.Clear, weight: 30 },
  ],
  [WeatherType.Fog]: [
    { to: WeatherType.Fog, weight: 40 },
    { to: WeatherType.Clear, weight: 50 },
    { to: WeatherType.Rain, weight: 10 },
  ],
  [WeatherType.Lightning]: [
    { to: WeatherType.Storm, weight: 50 },
    { to: WeatherType.Rain, weight: 30 },
    { to: WeatherType.Wildfire, weight: 20 },
  ],
  [WeatherType.Flood]:       [{ to: WeatherType.Rain, weight: 60 }, { to: WeatherType.Clear, weight: 40 }],
  [WeatherType.Drought]:     [{ to: WeatherType.Clear, weight: 60 }, { to: WeatherType.Wildfire, weight: 40 }],
  [WeatherType.Wildfire]:    [{ to: WeatherType.Clear, weight: 70 }, { to: WeatherType.Rain, weight: 30 }],
  [WeatherType.Earthquake]:  [{ to: WeatherType.Clear, weight: 100 }],
  [WeatherType.Heatwave]:    [{ to: WeatherType.Clear, weight: 60 }, { to: WeatherType.Drought, weight: 40 }],
  [WeatherType.Blizzard]:    [{ to: WeatherType.Snow, weight: 70 }, { to: WeatherType.Clear, weight: 30 }],
};

function weightedRandom<T>(options: { value: T; weight: number }[]): T {
  const total = options.reduce((s, o) => s + o.weight, 0);
  let r = Math.random() * total;
  for (const o of options) {
    r -= o.weight;
    if (r <= 0) return o.value;
  }
  return options[options.length - 1].value;
}

export class WeatherSystem implements System {
  readonly name = 'WeatherSystem';

  private state: WeatherState = {
    type: WeatherType.Clear,
    intensity: 0.3,
    windSpeed: 5,
    windDirection: 90,
    temperature: 20,
    humidity: 0.4,
    affectedChunks: [],
  };

  private lastChange = 0;

  update(tick: number): void {
    if (tick - this.lastChange < WEATHER_CHANGE_INTERVAL) return;
    this.lastChange = tick;
    this.evolveWeather();
  }

  get current(): WeatherState {
    return this.state;
  }

  /** Force a specific weather type (player power / mod hook). */
  forceWeather(type: WeatherType, intensity = 0.8): void {
    const previous = this.state.type;
    this.state = { ...this.state, type, intensity };
    eventBus.emit('weather:changed', { previous, current: type, intensity });
    if (this.isDisaster(type)) {
      eventBus.emit('weather:disaster', { type, affectedChunks: this.state.affectedChunks });
    }
  }

  private evolveWeather(): void {
    const transitions = TRANSITIONS[this.state.type];
    const next = weightedRandom(
      transitions.map((t) => ({ value: t.to, weight: t.weight }))
    );

    // Rare earthquake — independent of transition matrix
    const isEarthquake = Math.random() < DISASTER_CHANCE;
    const newType = isEarthquake ? WeatherType.Earthquake : next;

    if (newType !== this.state.type) {
      const previous = this.state.type;
      this.state = {
        ...this.state,
        type: newType,
        intensity: 0.3 + Math.random() * 0.7,
        windSpeed: Math.random() * 60,
        windDirection: Math.random() * 360,
        humidity: Math.random(),
      };
      eventBus.emit('weather:changed', {
        previous,
        current: newType,
        intensity: this.state.intensity,
      });
      if (this.isDisaster(newType)) {
        eventBus.emit('weather:disaster', {
          type: newType,
          affectedChunks: this.state.affectedChunks,
        });
      }
    }
  }

  private isDisaster(type: WeatherType): boolean {
    return [
      WeatherType.Flood,
      WeatherType.Wildfire,
      WeatherType.Earthquake,
      WeatherType.Blizzard,
      WeatherType.Drought,
    ].includes(type);
  }
}

export const weatherSystem = new WeatherSystem();
