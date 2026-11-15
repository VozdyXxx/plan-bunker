import { test, expect } from 'vitest';
import { generateEnding } from './index';
import { CATEGORIES, type Category, type Character, type Scenario } from '../types';

function mk(id: string, tagsByCat: Partial<Record<Category, string[]>>): Character {
  const traits = {} as Character['traits'];
  for (const c of CATEGORIES) {
    traits[c] = { id: `${id}-${c}`, category: c, text: 'x', tags: tagsByCat[c] ?? [] };
  }
  return { playerId: id, traits };
}

const healthy: Scenario = { id: 's', title: 'Тест', years: 10, spots: 3, conditions: ['x'], tags: [] };
const disease: Scenario = { id: 'd', title: 'Вирус', years: 8, spots: 3, conditions: ['x'], tags: ['disease'] };

test('all survivors same gender -> extinction and 0% survival', () => {
  const s = [mk('a', { biology: ['male'] }), mk('b', { biology: ['male'] }), mk('c', { biology: ['male'] })];
  const r = generateEnding(s, healthy, () => 0);
  expect(r.outcomes).toContain('extinction:no-reproduction');
  expect(r.survivalPercent).toBe(0);
});

test('a maniac among survivors causes deaths', () => {
  const s = [mk('a', { biology: ['male'], trait: ['maniac'] }), mk('b', { biology: ['female'] })];
  const r = generateEnding(s, healthy, () => 0);
  expect(r.outcomes).toContain('deaths:maniac');
});

test('disease scenario without doctor or immune -> epidemic', () => {
  const s = [mk('a', { biology: ['male'] }), mk('b', { biology: ['female'] })];
  const r = generateEnding(s, disease, () => 0);
  expect(r.outcomes).toContain('epidemic');
});

test('disease scenario with a doctor -> no epidemic', () => {
  const s = [mk('a', { biology: ['male'], profession: ['doctor'] }), mk('b', { biology: ['female'] })];
  const r = generateEnding(s, disease, () => 0);
  expect(r.outcomes).not.toContain('epidemic');
});

test('narrative is non-empty and deterministic for a fixed rng', () => {
  const s = [mk('a', { biology: ['male'] }), mk('b', { biology: ['female'] })];
  const a = generateEnding(s, healthy, () => 0.3);
  const b = generateEnding(s, healthy, () => 0.3);
  expect(a.narrative.length).toBeGreaterThan(0);
  expect(a.narrative).toBe(b.narrative);
});
