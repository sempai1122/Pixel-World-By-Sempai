// ============================================================
// PIXEL EARTH — Core Types
// All fundamental type definitions used across the engine.
// ============================================================

// ─── IDs ────────────────────────────────────────────────────
export type EntityId = string;
export type ChunkId = string;
export type TileId = number;

// ─── Vector ─────────────────────────────────────────────────
export interface Vec2 {
  x: number;
  y: number;
}

// ─── Biome ──────────────────────────────────────────────────
export enum Biome {
  Ocean       = 'ocean',
  Beach       = 'beach',
  Desert      = 'desert',
  Grassland   = 'grassland',
  Forest      = 'forest',
  Jungle      = 'jungle',
  Swamp       = 'swamp',
  Mountain    = 'mountain',
  Snow        = 'snow',
  Volcano     = 'volcano',
  Cave        = 'cave',
  River       = 'river',
}

// ─── Tile ───────────────────────────────────────────────────
export interface Tile {
  id: TileId;
  x: number;
  y: number;
  biome: Biome;
  elevation: number;   // 0–1
  moisture: number;    // 0–1
  temperature: number; // Celsius
  fertility: number;   // 0–1
  resource?: ResourceType;
  occupied: boolean;
}

// ─── Chunk ──────────────────────────────────────────────────
export const CHUNK_SIZE = 32; // tiles per side

export interface Chunk {
  id: ChunkId;
  cx: number; // chunk grid X
  cy: number; // chunk grid Y
  tiles: Tile[];
  loaded: boolean;
  lastAccess: number; // timestamp
}

// ─── Resources ──────────────────────────────────────────────
export enum ResourceType {
  Wood    = 'wood',
  Stone   = 'stone',
  Iron    = 'iron',
  Gold    = 'gold',
  Coal    = 'coal',
  Food    = 'food',
  Water   = 'water',
  Oil     = 'oil',
}

// ─── World Time ─────────────────────────────────────────────
export interface WorldTime {
  tick: number;       // raw engine ticks
  second: number;
  minute: number;
  hour: number;
  day: number;
  month: number;
  year: number;
  century: number;
}

// ─── Weather ────────────────────────────────────────────────
export enum WeatherType {
  Clear       = 'clear',
  Rain        = 'rain',
  Snow        = 'snow',
  Fog         = 'fog',
  Storm       = 'storm',
  Lightning   = 'lightning',
  Flood       = 'flood',
  Drought     = 'drought',
  Wildfire    = 'wildfire',
  Earthquake  = 'earthquake',
  Heatwave    = 'heatwave',
  Blizzard    = 'blizzard',
}

export interface WeatherState {
  type: WeatherType;
  intensity: number; // 0–1
  windSpeed: number; // m/s
  windDirection: number; // degrees
  temperature: number;   // Celsius
  humidity: number;      // 0–1
  affectedChunks: ChunkId[];
}

// ─── Entity Base ─────────────────────────────────────────────
export enum EntityType {
  Human   = 'human',
  Animal  = 'animal',
  Plant   = 'plant',
  Vehicle = 'vehicle',
  Building= 'building',
}

export interface BaseEntity {
  id: EntityId;
  type: EntityType;
  position: Vec2;
  chunkId: ChunkId;
  alive: boolean;
  createdAt: WorldTime;
  tags: string[];
}

// ─── Human ──────────────────────────────────────────────────
export enum Gender {
  Male   = 'male',
  Female = 'female',
  Other  = 'other',
}

export enum PersonalityTrait {
  Aggressive  = 'aggressive',
  Peaceful    = 'peaceful',
  Ambitious   = 'ambitious',
  Lazy        = 'lazy',
  Generous    = 'generous',
  Greedy      = 'greedy',
  Social      = 'social',
  Introverted = 'introverted',
  Creative    = 'creative',
  Analytical  = 'analytical',
}

export enum JobType {
  Unemployed  = 'unemployed',
  Farmer      = 'farmer',
  Miner       = 'miner',
  Merchant    = 'merchant',
  Soldier     = 'soldier',
  Doctor      = 'doctor',
  Teacher     = 'teacher',
  Builder     = 'builder',
  Politician  = 'politician',
  Scientist   = 'scientist',
  Artist      = 'artist',
  Banker      = 'banker',
}

export interface HumanStats {
  health: number;    // 0–100
  hunger: number;    // 0–100 (0 = starving)
  thirst: number;    // 0–100 (0 = dehydrating)
  energy: number;    // 0–100 (0 = exhausted)
  happiness: number; // 0–100
  stress: number;    // 0–100
  money: number;
}

export interface Human extends BaseEntity {
  type: EntityType.Human;
  name: string;
  age: number;
  gender: Gender;
  birthday: WorldTime;
  stats: HumanStats;
  personality: PersonalityTrait[];
  job: JobType;
  education: number;    // 0–100
  skills: Record<string, number>;
  relationships: Record<EntityId, RelationshipType>;
  inventory: InventoryItem[];
  homeId?: EntityId;    // Building ID
  goals: Goal[];
  memory: MemoryEvent[];
  nationId?: string;
}

export enum RelationshipType {
  Family  = 'family',
  Friend  = 'friend',
  Partner = 'partner',
  Enemy   = 'enemy',
  Coworker= 'coworker',
}

export interface InventoryItem {
  resource: ResourceType;
  quantity: number;
}

export interface Goal {
  type: string;
  priority: number; // 0–1
  targetId?: EntityId;
  targetPos?: Vec2;
  data?: Record<string, unknown>;
}

export interface MemoryEvent {
  tick: number;
  type: string;
  description: string;
  emotional_weight: number; // -1 to 1
}

// ─── Animal ─────────────────────────────────────────────────
export enum AnimalSpecies {
  Wolf    = 'wolf',
  Deer    = 'deer',
  Bear    = 'bear',
  Rabbit  = 'rabbit',
  Fish    = 'fish',
  Bird    = 'bird',
  Bee     = 'bee',
  Snake   = 'snake',
  Horse   = 'horse',
  Cow     = 'cow',
}

export interface Animal extends BaseEntity {
  type: EntityType.Animal;
  species: AnimalSpecies;
  health: number;
  hunger: number;
  age: number;
  isPredator: boolean;
  target?: EntityId;
}

// ─── Building ────────────────────────────────────────────────
export enum BuildingType {
  House       = 'house',
  Apartment   = 'apartment',
  Farm        = 'farm',
  School      = 'school',
  Hospital    = 'hospital',
  Market      = 'market',
  Bank        = 'bank',
  Factory     = 'factory',
  GovernmentBuilding = 'government',
  Military    = 'military',
  PowerPlant  = 'powerplant',
  Airport     = 'airport',
  Port        = 'port',
  Restaurant  = 'restaurant',
}

export interface Building extends BaseEntity {
  type: EntityType.Building;
  buildingType: BuildingType;
  ownerId?: EntityId;
  occupants: EntityId[];
  capacity: number;
  condition: number; // 0–100
  nationId?: string;
}

// ─── Game Speed ──────────────────────────────────────────────
export enum GameSpeed {
  Paused  = 0,
  Normal  = 1,
  Fast    = 3,
  Faster  = 10,
  Ultra   = 50,
}

// ─── Save State ──────────────────────────────────────────────
export interface SaveState {
  version: string;
  timestamp: number;
  worldTime: WorldTime;
  worldSeed: number;
  entities: BaseEntity[];
  chunks: Chunk[];
  weather: WeatherState;
  history: HistoryEvent[];
}

// ─── History ─────────────────────────────────────────────────
export enum HistoryEventType {
  Birth         = 'birth',
  Death         = 'death',
  Marriage      = 'marriage',
  Election      = 'election',
  War           = 'war',
  Revolution    = 'revolution',
  Discovery     = 'discovery',
  Disaster      = 'disaster',
  Pandemic      = 'pandemic',
  EconomicCrash = 'economic_crash',
  CityFounded   = 'city_founded',
  Treaty        = 'treaty',
}

export interface HistoryEvent {
  id: string;
  type: HistoryEventType;
  time: WorldTime;
  description: string;
  involvedIds: EntityId[];
  location?: Vec2;
}
