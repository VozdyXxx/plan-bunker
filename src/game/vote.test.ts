import { test, expect } from 'vitest';
import { tallyVotes } from './vote';
import type { Player } from './types';

function players(spec: Array<[string, boolean]>): Player[] {
  return spec.map(([id, alive]) => ({ id, name: id, alive, revealed: [] }));
}

test('the player with the most votes is eliminated', () => {
  const ps = players([['a', true], ['b', true], ['c', true], ['d', true], ['e', true]]);
  const res = tallyVotes({ a: 'b', c: 'b', d: 'e' }, ps);
  expect(res.eliminated).toBe('b');
  expect(res.tie).toBe(false);
});

test('a tie is resolved deterministically by smallest id and flagged', () => {
  const ps = players([['a', true], ['b', true], ['c', true], ['d', true]]);
  const res = tallyVotes({ a: 'b', c: 'd' }, ps);
  expect(res.eliminated).toBe('b');
  expect(res.tie).toBe(true);
});

test('votes for an already eliminated player are ignored', () => {
  const ps = players([['a', true], ['b', true], ['c', true], ['e', false]]);
  const res = tallyVotes({ a: 'e', b: 'c' }, ps);
  expect(res.eliminated).toBe('c');
});
