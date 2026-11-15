import { test, expect } from 'vitest';
import { isTrait, type Trait, type Character, type RoomState } from './types';

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
