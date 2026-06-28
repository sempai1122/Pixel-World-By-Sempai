// ============================================================
// PIXEL EARTH — HUD (Heads-Up Display)
// Main UI overlay: time, weather, entity count, controls.
// ============================================================

import { useGameStore } from '../../core/GameStore';
import { GameSpeed, WeatherType } from '../../core/types';
import { engine } from '../../core/engine/GameEngine';
import { humanAISystem } from '../../entities/human/HumanAISystem';
import { weatherSystem } from '../../world/weather/WeatherSystem';
import styles from './HUD.module.css';

const SPEED_OPTIONS: { label: string; value: GameSpeed }[] = [
  { label: '⏸', value: GameSpeed.Paused },
  { label: '▶',  value: GameSpeed.Normal },
  { label: '⏩',  value: GameSpeed.Fast   },
  { label: '⏭',  value: GameSpeed.Faster  },
  { label: '⚡',  value: GameSpeed.Ultra   },
];

const WEATHER_ICONS: Partial<Record<WeatherType, string>> = {
  [WeatherType.Clear]:      '☀️',
  [WeatherType.Rain]:       '🌧️',
  [WeatherType.Snow]:       '❄️',
  [WeatherType.Storm]:      '⛈️',
  [WeatherType.Fog]:        '🌫️',
  [WeatherType.Lightning]:  '⚡',
  [WeatherType.Flood]:      '🌊',
  [WeatherType.Drought]:    '🏜️',
  [WeatherType.Wildfire]:   '🔥',
  [WeatherType.Earthquake]: '📳',
  [WeatherType.Heatwave]:   '🥵',
  [WeatherType.Blizzard]:   '🌨️',
};

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0');
}

export function HUD() {
  const { speed, worldTime, weather, entityCount, loadedChunkCount, setSpeed } = useGameStore();

  const { hour, minute, day, month, year, century } = worldTime;
  const displayYear = century * 100 + year;
  const timeStr = `Y${displayYear} M${pad(month + 1)} D${pad(day + 1)}  ${pad(hour)}:${pad(minute)}`;

  function handleSpeedChange(s: GameSpeed) {
    setSpeed(s);
    engine.setSpeed(s);
  }

  function handleSpawnHuman() {
    humanAISystem.spawnHuman(Math.random() * 50, Math.random() * 50);
  }

  function handleWeatherChange(e: React.ChangeEvent<HTMLSelectElement>) {
    weatherSystem.forceWeather(e.target.value as WeatherType, 0.9);
  }

  const weatherIcon = WEATHER_ICONS[weather.type] ?? '🌍';

  return (
    <div className={styles.hud}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.worldTime}>{timeStr}</div>

        <div className={styles.weather}>
          <span className={styles.weatherIcon}>{weatherIcon}</span>
          <span className={styles.weatherName}>{weather.type}</span>
          <span className={styles.weatherTemp}>{Math.round(weather.temperature)}°C</span>
        </div>

        <div className={styles.stats}>
          <span>👥 {entityCount.toLocaleString()}</span>
          <span>🗺️ {loadedChunkCount} chunks</span>
        </div>
      </div>

      {/* Bottom controls */}
      <div className={styles.bottomBar}>
        {/* Speed buttons */}
        <div className={styles.speedControls}>
          {SPEED_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.speedBtn} ${speed === opt.value ? styles.active : ''}`}
              onClick={() => handleSpeedChange(opt.value)}
              title={`Speed ${opt.value}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* God Powers */}
        <div className={styles.godPowers}>
          <button className={styles.powerBtn} onClick={handleSpawnHuman} title="Spawn Human">
            👤 Spawn
          </button>
          <select className={styles.weatherSelect} onChange={handleWeatherChange} title="Change Weather">
            <option value="">☁️ Weather</option>
            {Object.values(WeatherType).map((w) => (
              <option key={w} value={w}>{WEATHER_ICONS[w] ?? ''} {w}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
