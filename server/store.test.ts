import { test, expect } from 'vitest';
import { createRoomStore } from './store';

const host = { id: 'h1', name: 'Хост', alive: true, revealed: [] };

test('create returns a 4-6 char code and stores a lobby room with the host', () => {
  const store = createRoomStore();
  const code = store.create(host);
  expect(code.length).toBeGreaterThanOrEqual(4);
  expect(code.length).toBeLessThanOrEqual(6);
  const room = store.get(code)!;
  expect(room.phase).toBe('lobby');
  expect(room.players.map((p) => p.id)).toEqual(['h1']);
});

test('join adds a player', () => {
  const store = createRoomStore();
  const code = store.create(host);
  const room = store.join(code, { id: 'p2', name: 'Аня', alive: true, revealed: [] })!;
  expect(room.players.map((p) => p.id)).toEqual(['h1', 'p2']);
});

test('re-join with the same id does not duplicate the player (reconnect)', () => {
  const store = createRoomStore();
  const code = store.create(host);
  store.join(code, { id: 'p2', name: 'Аня', alive: true, revealed: [] });
  const room = store.join(code, { id: 'p2', name: 'Аня', alive: true, revealed: [] })!;
  expect(room.players.filter((p) => p.id === 'p2')).toHaveLength(1);
});

test('get for an unknown code returns undefined', () => {
  const store = createRoomStore();
  expect(store.get('ZZZZ')).toBeUndefined();
});

test('vote merges each voter without clobbering others (no lost update)', () => {
  const store = createRoomStore();
  const code = store.create(host);
  store.join(code, { id: 'p2', name: 'Аня', alive: true, revealed: [] });
  store.vote(code, 'h1', 'p2');
  store.vote(code, 'p2', 'h1');
  expect(store.get(code)!.votes).toEqual({ h1: 'p2', p2: 'h1' });
});

test('reveal adds a category once per player', () => {
  const store = createRoomStore();
  const code = store.create(host);
  store.reveal(code, 'h1', 'profession');
  store.reveal(code, 'h1', 'profession');
  expect(store.get(code)!.players.find((p) => p.id === 'h1')!.revealed).toEqual(['profession']);
});
