import { describe, it, expect } from 'vitest';
import { computeFactors } from './factors';
import type { Character, BunkerState, Catastrophe } from '../types';

function ch(tags: string[]): Character {
  return {
    playerId: Math.random().toString(36).slice(2),
    // Все теги кладём в одну карту — hasTag смотрит по всем картам персонажа.
    traits: { health: { id: 'h', category: 'health', text: '', tags } } as Character['traits'],
  };
}
function bunker(over: Partial<BunkerState> = {}): BunkerState {
  return {
    years: 5,
    foodMonths: 6,
    waterMonths: 600,
    spots: 3,
    rooms: [{ id: 'medbay', name: 'Медотсек', locked: true, unlockTag: 'doctor' }],
    findings: [],
    rats: false,
    brokenGenerator: false,
    extraFood: 0,
    drugs: false,
    ...over,
  };
}
const cat: Catastrophe = { id: 'c', title: 'Катастрофа', text: '...' };

describe('computeFactors', () => {
  it('эпидемия без врача + нехватка еды → низкий шанс бункера', () => {
    const f = computeFactors([ch(['contagious', 'male', 'age:30'])], [], bunker(), cat);
    expect(f.contagion).toBe(true);
    expect(f.food).toContain('не хватит');
    expect(f.survivalPercentBunker).toBeLessThan(50);
  });

  it('врач повышает шанс по сравнению с его отсутствием', () => {
    const withDoc = computeFactors(
      [ch(['contagious', 'male', 'age:30']), ch(['doctor', 'female', 'age:28'])],
      [],
      bunker({ foodMonths: 600 }),
      cat,
    );
    const without = computeFactors(
      [ch(['contagious', 'male', 'age:30']), ch(['female', 'age:28'])],
      [],
      bunker({ foodMonths: 600 }),
      cat,
    );
    expect(withDoc.survivalPercentBunker).toBeGreaterThan(without.survivalPercentBunker);
  });

  it('только мужчины → продолжение рода невозможно', () => {
    const f = computeFactors([ch(['male', 'age:30']), ch(['male', 'age:35'])], [], bunker({ foodMonths: 600 }), cat);
    expect(f.demography).toContain('невозможно');
  });

  it('пара мужчина+женщина детородного возраста → продолжение возможно', () => {
    const f = computeFactors([ch(['male', 'age:30']), ch(['female', 'age:28'])], [], bunker({ foodMonths: 600 }), cat);
    expect(f.demography).toContain('возможно');
  });

  it('наркотики снижают шанс', () => {
    const base = computeFactors([ch(['male', 'age:30']), ch(['female', 'age:28'])], [], bunker({ foodMonths: 600 }), cat);
    const drugged = computeFactors(
      [ch(['male', 'age:30']), ch(['female', 'age:28'])],
      [],
      bunker({ foodMonths: 600, drugs: true }),
      cat,
    );
    expect(drugged.survivalPercentBunker).toBeLessThan(base.survivalPercentBunker);
    expect(drugged.drugs).toBe(true);
  });

  it('детерминирован', () => {
    const a = computeFactors([ch(['male', 'age:30'])], [], bunker(), cat);
    const b = computeFactors([ch(['male', 'age:30'])], [], bunker(), cat);
    expect(a.survivalPercentBunker).toBe(b.survivalPercentBunker);
  });
});
