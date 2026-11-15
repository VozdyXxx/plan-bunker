export const CATEGORIES = [
  'profession',
  'biology',
  'health',
  'hobby',
  'baggage',
  'fact',
  'phobia',
  'trait',
  'special',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Trait {
  id: string;
  category: Category;
  text: string;
  /** Semantic tags the endings engine reads, e.g. 'maniac', 'doctor', 'immune', 'infertile'. */
  tags: string[];
}

export interface Character {
  playerId: string;
  traits: Record<Category, Trait>;
}

// ----- Карты навыков («особые условия») -----

export const ABILITY_KINDS = ['active', 'on_eliminated', 'on_survived'] as const;
export type AbilityKind = (typeof ABILITY_KINDS)[number];

/** Ядровые механики карт навыков. Флейвор строится поверх них в генераторе. */
export const ABILITY_MECHANICS = [
  // активные
  'vote_immune',
  'steal_ability',
  'swap_card',
  'peek',
  'double_vote',
  'cancel_vote',
  'force_reveal',
  'protect',
  'draw_ability',
  'swap_players_votes',
  // при вылете
  'rats',
  'break_generator',
  'drag_random',
  'revote',
  'take_baggage',
  'leave_disease',
  'jam_door',
  // при проходе
  'drugs',
  'extra_spot',
  'extra_food',
  'secret_contagious',
  'unlock_room',
  'bring_animal',
] as const;
export type AbilityMechanic = (typeof ABILITY_MECHANICS)[number];

export interface AbilityCard {
  id: string;
  kind: AbilityKind;
  mechanic: AbilityMechanic;
  title: string;
  text: string;
  used?: boolean;
  params?: Record<string, number>;
}

// ----- Бункер и катастрофа -----

export interface BunkerRoom {
  id: string;
  name: string;
  locked: boolean;
  /** Тег характеристики, открывающий комнату (напр. 'doctor' для медотсека). */
  unlockTag?: string;
}

export interface BunkerState {
  years: number;
  foodMonths: number;
  waterMonths: number;
  spots: number;
  rooms: BunkerRoom[];
  findings: string[];
  rats: boolean;
  brokenGenerator: boolean;
  extraFood: number;
  drugs: boolean;
}

export interface Catastrophe {
  id: string;
  title: string;
  text: string;
}

export interface BunkerPlace {
  id: string;
  title: string;
  text: string;
}

export interface Scenario {
  id: string;
  title: string;
  years: number;
  spots: number;
  conditions: string[];
  /** Tags like 'disease', 'cold', 'radiation' used by the endings engine. */
  tags: string[];
}

export type Phase = 'lobby' | 'round' | 'vote' | 'ending';

export interface Player {
  id: string;
  name: string;
  alive: boolean;
  revealed: Category[];
  isBot?: boolean;
  /** Две карты навыков игрока. */
  abilities?: AbilityCard[];
  /** Произвольные условия/модификаторы, выданные админом или эффектами. */
  conditions?: string[];
  /** Служебное: защищён от голосования в текущем раунде. */
  voteImmuneRound?: number;
}

export interface RoomState {
  code: string;
  phase: Phase;
  round: number;
  players: Player[];
  scenarioId: string | null;
  /** Bunker capacity; set when the scenario is chosen. */
  spots: number;
  /** Game payload, filled once the host starts the game. Synced as plain JSON. */
  scenario?: Scenario;
  characters?: Character[];
  /** Index into alive players whose turn it is to reveal. */
  turn?: number;
  /** voterId -> targetId for the current vote. */
  votes?: Record<string, string>;
  /** Состояние бункера и выбранная катастрофа/локация (заполняются при старте). */
  bunker?: BunkerState;
  catastrophe?: Catastrophe;
  place?: BunkerPlace;
  /** Старая форма концовки; будет заменена на EndingStory в Task 12. */
  ending?: { outcomes: string[]; narrative: string; survivalPercent: number };
}

/** Структурированная ИИ-история концовки (Task 7). */
export interface EndingStory {
  groups: {
    bunker: { survivalPercent: number; pros: string[]; cons: string[] };
    exiled: { survivalPercent: number; pros: string[]; cons: string[] };
  };
  chronicle: string;
  survivors: { name: string; survived: boolean; text: string }[];
  exiled: { name: string; text: string }[];
  secrets: { name: string; text: string }[];
  tableMistake: string;
}

export function isTrait(value: unknown): value is Trait {
  if (typeof value !== 'object' || value === null) return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.id === 'string' &&
    typeof t.text === 'string' &&
    Array.isArray(t.tags) &&
    typeof t.category === 'string' &&
    (CATEGORIES as readonly string[]).includes(t.category)
  );
}

export function isAbilityKind(value: unknown): value is AbilityKind {
  return typeof value === 'string' && (ABILITY_KINDS as readonly string[]).includes(value);
}

export function isAbilityCard(value: unknown): value is AbilityCard {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.id === 'string' &&
    isAbilityKind(c.kind) &&
    typeof c.mechanic === 'string' &&
    (ABILITY_MECHANICS as readonly string[]).includes(c.mechanic) &&
    typeof c.title === 'string' &&
    typeof c.text === 'string'
  );
}
