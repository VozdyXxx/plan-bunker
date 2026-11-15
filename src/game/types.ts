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
}

export interface RoomState {
  code: string;
  phase: Phase;
  round: number;
  players: Player[];
  scenarioId: string | null;
  /** Bunker capacity; set when the scenario is chosen. */
  spots: number;
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
