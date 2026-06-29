// ============================================================
// PIXEL EARTH — World Time System
// Converts raw engine ticks into simulated world time.
// Seconds → Minutes → Hours → Days → Months → Years → Centuries
// ============================================================

import type { System } from '../core/engine/GameEngine';
import type { WorldTime } from '../core/types';

// Simulation time constants (ticks per unit)
const TICKS_PER_SECOND = 20;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_MONTH = 30;
const MONTHS_PER_YEAR = 12;
const YEARS_PER_CENTURY = 100;

const TICKS_PER_MINUTE  = TICKS_PER_SECOND  * SECONDS_PER_MINUTE;
const TICKS_PER_HOUR    = TICKS_PER_MINUTE   * MINUTES_PER_HOUR;
const TICKS_PER_DAY     = TICKS_PER_HOUR     * HOURS_PER_DAY;
const TICKS_PER_MONTH   = TICKS_PER_DAY      * DAYS_PER_MONTH;
const TICKS_PER_YEAR    = TICKS_PER_MONTH    * MONTHS_PER_YEAR;
const TICKS_PER_CENTURY = TICKS_PER_YEAR     * YEARS_PER_CENTURY;

export function ticksToWorldTime(tick: number): WorldTime {
  const century = Math.floor(tick / TICKS_PER_CENTURY);
  const rem0    = tick % TICKS_PER_CENTURY;
  const year    = Math.floor(rem0 / TICKS_PER_YEAR);
  const rem1    = rem0 % TICKS_PER_YEAR;
  const month   = Math.floor(rem1 / TICKS_PER_MONTH);
  const rem2    = rem1 % TICKS_PER_MONTH;
  const day     = Math.floor(rem2 / TICKS_PER_DAY);
  const rem3    = rem2 % TICKS_PER_DAY;
  const hour    = Math.floor(rem3 / TICKS_PER_HOUR);
  const rem4    = rem3 % TICKS_PER_HOUR;
  const minute  = Math.floor(rem4 / TICKS_PER_MINUTE);
  const rem5    = rem4 % TICKS_PER_MINUTE;
  const second  = Math.floor(rem5 / TICKS_PER_SECOND);

  return { tick, second, minute, hour, day, month, year, century };
}

export function worldTimeToTicks(t: WorldTime): number {
  return (
    t.century * TICKS_PER_CENTURY +
    t.year    * TICKS_PER_YEAR    +
    t.month   * TICKS_PER_MONTH   +
    t.day     * TICKS_PER_DAY     +
    t.hour    * TICKS_PER_HOUR    +
    t.minute  * TICKS_PER_MINUTE  +
    t.second  * TICKS_PER_SECOND
  );
}

export function formatWorldTime(t: WorldTime): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return (
    `Year ${t.century * YEARS_PER_CENTURY + t.year}, ` +
    `Month ${pad(t.month + 1)}, Day ${pad(t.day + 1)} ` +
    `${pad(t.hour)}:${pad(t.minute)}:${pad(t.second)}`
  );
}

/** The TimeSystem registers with the engine and keeps time state updated. */
export class TimeSystem implements System {
  readonly name = 'TimeSystem';
  private currentTime: WorldTime = ticksToWorldTime(0);

  update(tick: number): void {
    this.currentTime = ticksToWorldTime(tick);
  }

  get time(): WorldTime {
    return this.currentTime;
  }

  get formatted(): string {
    return formatWorldTime(this.currentTime);
  }

  /** Returns true if a certain number of ticks corresponds to a new day. */
  isNewDay(tick: number): boolean {
    return tick % TICKS_PER_DAY === 0;
  }

  isNewMonth(tick: number): boolean {
    return tick % TICKS_PER_MONTH === 0;
  }

  isNewYear(tick: number): boolean {
    return tick % TICKS_PER_YEAR === 0;
  }
}

export const timeSystem = new TimeSystem();
