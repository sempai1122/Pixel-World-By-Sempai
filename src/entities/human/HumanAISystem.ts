// ============================================================
// PIXEL EARTH — Human AI System
// Drives autonomous behavior for all human entities.
// Each human has needs, goals, and makes decisions each tick.
// ============================================================

import type { System } from '../../core/engine/GameEngine';
import type { Human } from '../../core/types';
import { EntityType, JobType } from '../../core/types';
import { entityRegistry } from '../../core/registry/EntityRegistry';
import { eventBus } from '../../core/events/EventBus';
import { nameGenerator } from '../../utils/NameGenerator';

// How often each human's AI ticks (not every engine tick)
const HUMAN_AI_INTERVAL = 10;

// Needs decay rates per AI tick
const HUNGER_DECAY  = 0.05;
const THIRST_DECAY  = 0.08;
const ENERGY_DECAY  = 0.03;

// Thresholds that trigger priority goals
const CRITICAL_HUNGER  = 20;
const CRITICAL_THIRST  = 15;
const CRITICAL_ENERGY  = 10;

export class HumanAISystem implements System {
  readonly name = 'HumanAISystem';
  private lastAI = 0;

  update(tick: number): void {
    if (tick - this.lastAI < HUMAN_AI_INTERVAL) return;
    this.lastAI = tick;

    const humans = entityRegistry.byType<Human>(EntityType.Human);
    for (const human of humans) {
      this.tickHuman(human, tick);
    }
  }

  private tickHuman(human: Human, tick: number): void {
    this.decayNeeds(human);
    this.checkDeath(human, tick);
    this.prioritizeGoals(human);
    this.executeGoal(human);
    entityRegistry.update(human);
  }

  private decayNeeds(human: Human): void {
    human.stats.hunger  = Math.max(0, human.stats.hunger  - HUNGER_DECAY);
    human.stats.thirst  = Math.max(0, human.stats.thirst  - THIRST_DECAY);
    human.stats.energy  = Math.max(0, human.stats.energy  - ENERGY_DECAY);

    // Starving/dehydrating causes health loss
    if (human.stats.hunger < 5)  human.stats.health -= 0.5;
    if (human.stats.thirst < 5)  human.stats.health -= 0.8;
    if (human.stats.energy < 5)  human.stats.stress  = Math.min(100, human.stats.stress + 1);

    // Natural happiness drift toward baseline
    const target = (human.stats.health + (100 - human.stats.stress)) / 2;
    human.stats.happiness += (target - human.stats.happiness) * 0.01;
  }

  private checkDeath(human: Human, tick: number): void {
    if (human.stats.health <= 0) {
      human.alive = false;
      entityRegistry.remove(human.id);
      eventBus.emit('human:died', {
        entityId: human.id,
        name: human.name,
        cause: human.stats.hunger < 5 ? 'starvation' : 'poor health',
      });
    }

    // Natural aging death
    if (human.age > 80 && Math.random() < 0.001) {
      human.alive = false;
      entityRegistry.remove(human.id);
      eventBus.emit('human:died', {
        entityId: human.id,
        name: human.name,
        cause: 'old age',
      });
    }
  }

  private prioritizeGoals(human: Human): void {
    // Reset and rebuild goal list based on current needs
    human.goals = [];

    if (human.stats.thirst < CRITICAL_THIRST) {
      human.goals.push({ type: 'find_water', priority: 1.0 });
    }
    if (human.stats.hunger < CRITICAL_HUNGER) {
      human.goals.push({ type: 'find_food', priority: 0.9 });
    }
    if (human.stats.energy < CRITICAL_ENERGY) {
      human.goals.push({ type: 'sleep', priority: 0.85 });
    }

    // Social & economic goals (lower priority)
    if (human.stats.money < 10) {
      human.goals.push({ type: 'work', priority: 0.7 });
    }
    if (human.stats.happiness < 30) {
      human.goals.push({ type: 'socialize', priority: 0.5 });
    }

    // Default: wander
    if (human.goals.length === 0) {
      human.goals.push({ type: 'wander', priority: 0.1 });
    }

    // Sort by priority descending
    human.goals.sort((a, b) => b.priority - a.priority);
  }

  private executeGoal(human: Human): void {
    const goal = human.goals[0];
    if (!goal) return;

    switch (goal.type) {
      case 'find_water':
        human.stats.thirst = Math.min(100, human.stats.thirst + 20);
        this.addMemory(human, 'drank_water', 'Drank water.', 0.1);
        break;

      case 'find_food':
        human.stats.hunger = Math.min(100, human.stats.hunger + 25);
        this.addMemory(human, 'ate', 'Ate a meal.', 0.2);
        break;

      case 'sleep':
        human.stats.energy = Math.min(100, human.stats.energy + 40);
        break;

      case 'work':
        human.stats.money += this.getWage(human.job);
        human.stats.energy -= 5;
        break;

      case 'socialize':
        human.stats.happiness = Math.min(100, human.stats.happiness + 5);
        human.stats.stress    = Math.max(0, human.stats.stress - 3);
        break;

      case 'wander':
        // Move slightly in a random direction
        human.position.x += (Math.random() - 0.5) * 2;
        human.position.y += (Math.random() - 0.5) * 2;
        break;
    }
  }

  private getWage(job: JobType): number {
    const wages: Record<JobType, number> = {
      [JobType.Unemployed]: 0,
      [JobType.Farmer]:     3,
      [JobType.Miner]:      5,
      [JobType.Merchant]:   8,
      [JobType.Soldier]:    6,
      [JobType.Doctor]:     15,
      [JobType.Teacher]:    10,
      [JobType.Builder]:    7,
      [JobType.Politician]: 20,
      [JobType.Scientist]:  18,
      [JobType.Artist]:     4,
      [JobType.Banker]:     25,
    };
    return wages[job] ?? 0;
  }

  private addMemory(human: Human, type: string, description: string, weight: number): void {
    human.memory.push({ tick: Date.now(), type, description, emotional_weight: weight });
    // Keep memory bounded
    if (human.memory.length > 100) {
      human.memory = human.memory.slice(-100);
    }
  }

  /** Spawn a new human at a given position. */
  spawnHuman(worldX: number, worldY: number): Human {
    const genders = ['male', 'female', 'other'] as const;
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const now = { tick: 0, second: 0, minute: 0, hour: 0, day: 0, month: 0, year: 0, century: 0 };

    const human: Human = {
      id: `human_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: EntityType.Human,
      position: { x: worldX, y: worldY },
      chunkId: '',
      alive: true,
      createdAt: now,
      tags: [],
      name: nameGenerator.generate(gender),
      age: 18 + Math.floor(Math.random() * 40),
      gender,
      birthday: now,
      stats: {
        health: 80 + Math.random() * 20,
        hunger: 60 + Math.random() * 40,
        thirst: 60 + Math.random() * 40,
        energy: 70 + Math.random() * 30,
        happiness: 50 + Math.random() * 30,
        stress: Math.random() * 20,
        money: Math.floor(Math.random() * 100),
      },
      personality: [],
      job: JobType.Unemployed,
      education: Math.random() * 50,
      skills: {},
      relationships: {},
      inventory: [],
      goals: [],
      memory: [],
    };

    entityRegistry.add(human);
    eventBus.emit('human:born', { entityId: human.id, name: human.name, parentIds: [] });
    return human;
  }
}

export const humanAISystem = new HumanAISystem();
