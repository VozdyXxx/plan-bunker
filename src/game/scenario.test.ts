import { test, expect, describe, it } from 'vitest';
import { pickScenario, buildScenario, spots } from './scenario';
import { mulberry32 } from './rng';

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

describe('buildScenario', () => {
  it('spots — половина игроков, минимум 1', () => {
    expect(spots(8)).toBe(4);
    expect(spots(1)).toBe(1);
  });

  it('возвращает катастрофу и бункер с непустыми текстами', () => {
    const s = buildScenario(8, mulberry32(1));
    expect(s.catastrophe.title.length).toBeGreaterThan(0);
    expect(s.catastrophe.text.length).toBeGreaterThan(10);
    expect(s.place.title.length).toBeGreaterThan(0);
    expect(s.place.text.length).toBeGreaterThan(10);
  });

  it('бункер согласован: места, запасы, срок, комнаты', () => {
    const s = buildScenario(8, mulberry32(2));
    expect(s.bunker.spots).toBe(spots(8));
    expect(s.bunker.years).toBeGreaterThan(0);
    expect(s.bunker.foodMonths).toBeGreaterThan(0);
    expect(s.bunker.waterMonths).toBeGreaterThan(0);
    expect(s.bunker.rooms.length).toBeGreaterThan(0);
    expect(s.bunker.rooms.some((r) => r.locked && r.unlockTag)).toBe(true);
    expect(s.bunker.rats).toBe(false);
    expect(s.bunker.drugs).toBe(false);
  });

  it('детерминирован при одном seed', () => {
    const a = buildScenario(6, mulberry32(42));
    const b = buildScenario(6, mulberry32(42));
    expect(a.catastrophe.id).toBe(b.catastrophe.id);
    expect(a.place.id).toBe(b.place.id);
    expect(a.bunker.years).toBe(b.bunker.years);
  });

  it('разные seed дают разнообразие', () => {
    const combos = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const s = buildScenario(6, mulberry32(i + 1));
      combos.add(`${s.catastrophe.id}|${s.place.id}`);
    }
    expect(combos.size).toBeGreaterThan(10);
  });
});
