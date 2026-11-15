import type { Character, Scenario } from '../types';

export interface FactorResult {
  outcomes: string[];
  /** Вычет из процента выживания человечества. */
  penalty: number;
  /** Жёсткий финал: человечество не продолжится. */
  extinct?: boolean;
}

/** Есть ли у персонажа тег в любой из его карт. */
function hasTag(ch: Character, tag: string): boolean {
  return Object.values(ch.traits).some((t) => t.tags.includes(tag));
}
function anyHasTag(survivors: Character[], tag: string): boolean {
  return survivors.some((ch) => hasTag(ch, tag));
}
function countTag(survivors: Character[], tag: string): number {
  return survivors.filter((ch) => hasTag(ch, tag)).length;
}

const DISEASE_TAGS = ['disease'];

/** Демография: без пары мужчина+женщина продолжения рода нет. */
export function demography(survivors: Character[]): FactorResult {
  const males = countTag(survivors, 'male');
  const females = countTag(survivors, 'female');
  if (males >= 1 && females >= 1 && survivors.length >= 2) {
    return { outcomes: ['reproduction:possible'], penalty: 0 };
  }
  return { outcomes: ['extinction:no-reproduction'], penalty: 100, extinct: true };
}

/** Маньяк среди выживших — жертвы. */
export function maniac(survivors: Character[]): FactorResult {
  if (anyHasTag(survivors, 'maniac')) return { outcomes: ['deaths:maniac'], penalty: 40 };
  return { outcomes: [], penalty: 0 };
}

/** Болезнь: без врача/иммунитета — эпидемия. */
export function disease(survivors: Character[], scenario: Scenario): FactorResult {
  const dangerous = scenario.tags.some((t) => DISEASE_TAGS.includes(t));
  if (!dangerous) return { outcomes: [], penalty: 0 };
  const protectedGroup = anyHasTag(survivors, 'doctor') || anyHasTag(survivors, 'immune');
  if (protectedGroup) return { outcomes: ['disease:contained'], penalty: 0 };
  return { outcomes: ['epidemic'], penalty: 50 };
}

/** Еда: без запасов или повара — голод. */
export function food(survivors: Character[]): FactorResult {
  if (anyHasTag(survivors, 'food') || anyHasTag(survivors, 'cook')) {
    return { outcomes: ['food:ok'], penalty: 0 };
  }
  return { outcomes: ['food:shortage'], penalty: 20 };
}

/** Психика: большой бункер без лидера — срывы и дрязги. */
export function psyche(survivors: Character[]): FactorResult {
  const hasLeader = anyHasTag(survivors, 'leader');
  if (survivors.length >= 4 && !hasLeader) {
    return { outcomes: ['psyche:tension'], penalty: 10 };
  }
  return { outcomes: [], penalty: 0 };
}

export const ALL_FACTORS = { demography, maniac, disease, food, psyche };
