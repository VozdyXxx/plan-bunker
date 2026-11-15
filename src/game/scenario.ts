import type { Scenario } from './types';
import scenarios from './content/scenarios.json';

type ScenarioBase = Omit<Scenario, 'spots'>;

/** Выбирает катастрофу и считает число мест в бункере (≈ половина игроков, минимум 1). */
export function pickScenario(playerCount: number, rng: () => number): Scenario {
  const pool = scenarios as ScenarioBase[];
  const base = pool[Math.floor(rng() * pool.length) % pool.length];
  const spots = Math.max(1, Math.floor(playerCount / 2));
  return { ...base, spots };
}
