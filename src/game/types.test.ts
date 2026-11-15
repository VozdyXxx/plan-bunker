import { test, expect, describe, it } from 'vitest';
import {
  isTrait,
  isAbilityKind,
  isAbilityCard,
  type Trait,
  type Character,
  type RoomState,
  type AbilityCard,
} from './types';

test('isTrait accepts a well-formed trait', () => {
  const t: Trait = { id: 'prof-1', category: 'profession', text: 'Дегустатор просрочки', tags: [] };
  expect(isTrait(t)).toBe(true);
});

test('isTrait rejects objects missing required fields', () => {
  expect(isTrait({ id: 'x', category: 'profession' })).toBe(false);
  expect(isTrait({ category: 'profession', text: 'a', tags: [] })).toBe(false);
  expect(isTrait(null)).toBe(false);
  expect(isTrait({ id: 'x', category: 'nope', text: 'a', tags: [] })).toBe(false);
});

test('Character and RoomState shapes compile and hold expected fields', () => {
  const trait: Trait = { id: 'h-1', category: 'health', text: 'Здоров как бык', tags: [] };
  const ch: Character = { playerId: 'p1', traits: { health: trait } as Character['traits'] };
  expect(ch.playerId).toBe('p1');

  const room: RoomState = {
    code: 'ABCD',
    phase: 'lobby',
    round: 0,
    players: [{ id: 'p1', name: 'Аня', alive: true, revealed: [] }],
    scenarioId: null,
    spots: 0,
  };
  expect(room.phase).toBe('lobby');
  expect(room.players[0].alive).toBe(true);
});

describe('isAbilityKind', () => {
  it('принимает три валидных вида', () => {
    expect(isAbilityKind('active')).toBe(true);
    expect(isAbilityKind('on_eliminated')).toBe(true);
    expect(isAbilityKind('on_survived')).toBe(true);
  });
  it('отклоняет мусор', () => {
    expect(isAbilityKind('passive')).toBe(false);
    expect(isAbilityKind(42)).toBe(false);
    expect(isAbilityKind(null)).toBe(false);
  });
});

describe('isAbilityCard', () => {
  const valid: AbilityCard = {
    id: 'active-0',
    kind: 'active',
    mechanic: 'vote_immune',
    title: 'Неприкосновенный',
    text: 'Против вас нельзя голосовать один раунд.',
  };

  it('принимает валидную карту', () => {
    expect(isAbilityCard(valid)).toBe(true);
  });
  it('принимает карту с used и params', () => {
    expect(isAbilityCard({ ...valid, used: true, params: { spots: 1 } })).toBe(true);
  });
  it('отклоняет карту с неверным kind', () => {
    expect(isAbilityCard({ ...valid, kind: 'passive' })).toBe(false);
  });
  it('отклоняет не-объекты и неполные карты', () => {
    expect(isAbilityCard(null)).toBe(false);
    expect(isAbilityCard({ id: 'x' })).toBe(false);
    expect(isAbilityCard({ ...valid, id: 123 })).toBe(false);
  });
});
