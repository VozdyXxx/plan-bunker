import type { Scenario, BunkerState, BunkerRoom, Catastrophe, BunkerPlace } from './types';
import scenarios from './content/scenarios.json';
import { pick, pickDistinct } from './rng';
import { CATASTROPHES, PLACES, ROOM_POOL, FINDINGS_POOL, YEARS_POOL } from './scenarios-content';

type ScenarioBase = Omit<Scenario, 'spots'>;

/** Число мест в бункере: половина игроков, округление вниз, минимум 1. */
export function spots(playerCount: number): number {
  return Math.max(1, Math.floor(playerCount / 2));
}

/** Устаревший выбор сценария (оставлен для совместимости). */
export function pickScenario(playerCount: number, rng: () => number): Scenario {
  const pool = scenarios as ScenarioBase[];
  const base = pool[Math.floor(rng() * pool.length) % pool.length];
  return { ...base, spots: spots(playerCount) };
}

export interface BuiltScenario {
  catastrophe: Catastrophe;
  place: BunkerPlace;
  bunker: BunkerState;
}

/** Собирает партийный сценарий: катастрофа + бункер (комбинаторно, почти без повторов). */
export function buildScenario(playerCount: number, rng: () => number): BuiltScenario {
  const catastrophe = pick(CATASTROPHES, rng);
  const place = pick(PLACES, rng);
  const spotsN = spots(playerCount);
  const years = pick(YEARS_POOL, rng);

  const count = 6 + Math.floor(rng() * 3); // 6..8 комнат
  const chosen = pickDistinct(ROOM_POOL, count, rng);
  const rooms: BunkerRoom[] = chosen.map((r) => ({
    id: r.id,
    name: r.name,
    locked: r.lockable && rng() < 0.5,
    unlockTag: r.unlockTag,
  }));
  // Гарантируем хотя бы одну запертую комнату с условием открытия.
  if (!rooms.some((r) => r.locked && r.unlockTag)) {
    const target = rooms.find((r) => r.unlockTag) ?? rooms[0];
    if (target) {
      target.locked = true;
      if (!target.unlockTag) {
        const src = ROOM_POOL.find((p) => p.id === target.id);
        target.unlockTag = src?.unlockTag ?? 'fixer';
      }
    }
  }

  const findings = pickDistinct(FINDINGS_POOL, 2 + Math.floor(rng() * 3), rng); // 2..4
  const monthsPerPerson = 6 + Math.floor(rng() * 19); // 6..24
  const foodMonths = Math.max(1, spotsN * monthsPerPerson);
  const waterMonths = Math.max(1, spotsN * (6 + Math.floor(rng() * 19)));

  const bunker: BunkerState = {
    years,
    foodMonths,
    waterMonths,
    spots: spotsN,
    rooms,
    findings,
    rats: false,
    brokenGenerator: false,
    extraFood: 0,
    drugs: false,
  };

  return { catastrophe, place, bunker };
}
