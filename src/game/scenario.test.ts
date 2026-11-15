import { test, expect } from 'vitest';
import { pickScenario } from './scenario';

const zero = () => 0;

test('bunker spots is half the players, rounded down, minimum 1', () => {
  expect(pickScenario(7, zero).spots).toBe(3);
  expect(pickScenario(1, zero).spots).toBe(1); // Review Focus: single player must not divide to 0
  expect(pickScenario(2, zero).spots).toBe(1);
  expect(pickScenario(16, zero).spots).toBe(8);
});

test('scenario has positive years and at least one condition', () => {
  const s = pickScenario(6, zero);
  expect(s.years).toBeGreaterThan(0);
  expect(s.conditions.length).toBeGreaterThanOrEqual(1);
  expect(typeof s.title).toBe('string');
});

test('deterministic for a fixed rng', () => {
  expect(pickScenario(6, () => 0.42).id).toBe(pickScenario(6, () => 0.42).id);
});

test('at least one scenario carries a disease tag for the endings engine', () => {
  const ids = new Set<string>();
  for (let i = 0; i < 50; i++) ids.add(pickScenario(6, () => i / 50).tags.join(','));
  expect([...ids].some((t) => t.includes('disease'))).toBe(true);
});
