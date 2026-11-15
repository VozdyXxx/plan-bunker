import { test, expect } from 'vitest';
import { loadContent } from './index';
import { CATEGORIES, isTrait } from '../types';

const content = loadContent();

const MIN: Record<string, number> = {
  profession: 500,
  biology: 300,
  health: 100,
  hobby: 350,
  baggage: 300,
  fact: 600,
  phobia: 100,
  trait: 180,
  special: 250,
};

test('каждая колода набирает целевой минимум объёма', () => {
  for (const c of CATEGORIES) {
    expect(content[c].length, c).toBeGreaterThanOrEqual(MIN[c]);
  }
});

test('нет повторов текста внутри колоды', () => {
  for (const c of CATEGORIES) {
    const texts = new Set(content[c].map((t) => t.text));
    expect(texts.size, c).toBe(content[c].length);
  }
});

test('нет запрещённых кривых фрагментов', () => {
  const banned = ['с короной', 'врачи в курсе', 'с дипломом из телеграма'];
  for (const c of CATEGORIES) {
    for (const t of content[c]) {
      for (const bad of banned) {
        expect(t.text.includes(bad), `${c}: "${t.text}"`).toBe(false);
      }
    }
  }
});

test('каждая запись — валидный Trait своей категории', () => {
  for (const c of CATEGORIES) {
    for (const t of content[c]) {
      expect(isTrait(t)).toBe(true);
      expect(t.category).toBe(c);
    }
  }
});

test('все id уникальны по всем колодам', () => {
  const ids = new Set<string>();
  let total = 0;
  for (const c of CATEGORIES) {
    for (const t of content[c]) {
      ids.add(t.id);
      total++;
    }
  }
  expect(ids.size).toBe(total);
});

test('здоровье — реальные состояния с тегами для концовки', () => {
  const tagsOf = (tag: string) => content.health.some((t) => t.tags.includes(tag));
  for (const tag of ['contagious', 'infertile', 'immune', 'needs-meds', 'disabled']) {
    expect(tagsOf(tag), tag).toBe(true);
  }
});

test('семантические теги для движка концовки на месте', () => {
  expect(content.biology.every((t) => t.tags.includes('male') || t.tags.includes('female'))).toBe(true);
  expect([...content.trait, ...content.special].some((t) => t.tags.includes('maniac'))).toBe(true);
  expect(content.profession.some((t) => t.tags.includes('doctor'))).toBe(true);
});
