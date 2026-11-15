import type { Character, Scenario } from '../types';
import { demography, maniac, disease, food, psyche } from './factors';
import { compose } from './compose';

export interface EndingResult {
  outcomes: string[];
  narrative: string;
  survivalPercent: number;
}

/** Генерирует концовку по набору выживших и сценарию катастрофы. */
export function generateEnding(survivors: Character[], scenario: Scenario, rng: () => number): EndingResult {
  const results = [
    demography(survivors),
    maniac(survivors),
    disease(survivors, scenario),
    food(survivors),
    psyche(survivors),
  ];

  const outcomes = results.flatMap((r) => r.outcomes);
  const extinct = results.some((r) => r.extinct);
  let percent = 100 - results.reduce((sum, r) => sum + r.penalty, 0);
  percent = Math.max(0, Math.min(100, percent));
  if (extinct) percent = 0;

  const narrative = compose(outcomes, { count: survivors.length, years: scenario.years, title: scenario.title, percent }, rng);
  return { outcomes, narrative, survivalPercent: percent };
}
