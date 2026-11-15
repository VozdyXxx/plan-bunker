import { test, expect } from 'vitest';
import { loadContent } from './index';
import { CATEGORIES, isTrait } from '../types';

const content = loadContent();

test('has at least 8000 traits in total', () => {
  const total = CATEGORIES.reduce((n, c) => n + (content[c]?.length ?? 0), 0);
  expect(total).toBeGreaterThanOrEqual(8000);
});

test('every category has entries and no duplicate texts within a category', () => {
  for (const c of CATEGORIES) {
    const list = content[c];
    expect(list.length).toBeGreaterThan(0);
    const texts = new Set(list.map((t) => t.text));
    expect(texts.size).toBe(list.length);
  }
});

test('every entry is a valid Trait whose category matches its bucket', () => {
  for (const c of CATEGORIES) {
    for (const t of content[c]) {
      expect(isTrait(t)).toBe(true);
      expect(t.category).toBe(c);
    }
  }
});

test('semantic tags the endings engine relies on are present', () => {
  expect(content.biology.every((t) => t.tags.includes('male') || t.tags.includes('female'))).toBe(true);
  expect([...content.trait, ...content.special].some((t) => t.tags.includes('maniac'))).toBe(true);
  expect(content.profession.some((t) => t.tags.includes('doctor'))).toBe(true);
  expect(content.health.some((t) => t.tags.includes('immune'))).toBe(true);
});
