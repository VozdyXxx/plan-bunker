import { test, expect } from 'vitest';
import { nextPhase } from './flow';
import type { Player, RoomState } from './types';

function players(n: number, aliveCount = n): Player[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    name: `P${i}`,
    alive: i < aliveCount,
    revealed: [],
  }));
}
function room(partial: Partial<RoomState>): RoomState {
  return { code: 'A', phase: 'lobby', round: 0, players: players(6), scenarioId: 's', spots: 3, ...partial };
}

test('lobby advances to round 1', () => {
  const r = nextPhase(room({ phase: 'lobby' }));
  expect(r.phase).toBe('round');
  expect(r.round).toBe(1);
});

test('round advances to vote', () => {
  expect(nextPhase(room({ phase: 'round', round: 1 })).phase).toBe('vote');
});

test('vote returns to round and increments while more alive than spots', () => {
  const r = nextPhase(room({ phase: 'vote', round: 1, players: players(6, 5), spots: 3 }));
  expect(r.phase).toBe('round');
  expect(r.round).toBe(2);
});

test('vote advances to ending when alive equals spots', () => {
  const r = nextPhase(room({ phase: 'vote', players: players(6, 3), spots: 3 }));
  expect(r.phase).toBe('ending');
});

test('single-player game still reaches ending', () => {
  let r = room({ phase: 'lobby', players: players(1), spots: 1 });
  r = nextPhase(r); // round
  r = nextPhase(r); // vote
  r = nextPhase(r); // ending
  expect(r.phase).toBe('ending');
});
