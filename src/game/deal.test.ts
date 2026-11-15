import { test, expect } from 'vitest';
import { dealCharacters } from './deal';
import { CATEGORIES } from './types';

function seededRng(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

test('each player gets exactly one trait per category', () => {
  const chars = dealCharacters(['p1', 'p2', 'p3', 'p4', 'p5'], seededRng(1));
  expect(chars).toHaveLength(5);
  for (const c of chars) {
    expect(Object.keys(c.traits).sort()).toEqual([...CATEGORIES].sort());
    for (const cat of CATEGORIES) {
      expect(c.traits[cat].category).toBe(cat);
    }
  }
});

test('no two players share the same trait text within a category', () => {
  const chars = dealCharacters(['p1', 'p2', 'p3', 'p4', 'p5'], seededRng(2));
  for (const cat of CATEGORIES) {
    const texts = chars.map((c) => c.traits[cat].text);
    expect(new Set(texts).size).toBe(texts.length);
  }
});

test('deterministic for a fixed rng seed', () => {
  const a = dealCharacters(['p1', 'p2'], seededRng(3));
  const b = dealCharacters(['p1', 'p2'], seededRng(3));
  expect(JSON.stringify(a)).toBe(JSON.stringify(b));
});
