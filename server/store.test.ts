import { test, expect, describe, it } from 'vitest';
import { createRoomStore } from './store';
import type { RoomState, BunkerState, Character } from '../src/game/types';

const host = { id: 'h1', name: 'Хост', alive: true, revealed: [] };

function bunker(): BunkerState {
  return { years: 3, foodMonths: 12, waterMonths: 12, spots: 2, rooms: [], findings: [], rats: false, brokenGenerator: false, extraFood: 0, drugs: false };
}
function charWithBaggage(playerId: string, text: string): Character {
  return { playerId, traits: { baggage: { id: `b-${playerId}`, category: 'baggage', text, tags: [] } } as unknown as Character['traits'] };
}
function playingRoom(code: string): RoomState {
  return {
    code,
    phase: 'round',
    round: 1,
    players: [
      { id: 'h1', name: 'Хост', alive: true, revealed: [], abilities: [{ id: 'c1', kind: 'active', mechanic: 'vote_immune', title: 'T', text: 'T', used: false }] },
      { id: 'p2', name: 'Аня', alive: true, revealed: [], abilities: [] },
    ],
    scenarioId: 'x',
    spots: 1,
    bunker: bunker(),
    characters: [charWithBaggage('h1', 'Ружьё'), charWithBaggage('p2', 'Гитара')],
    votes: {},
  };
}

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

describe('v2: playAbility и adminAction', () => {
  it('playAbility применяет активную карту', () => {
    const store = createRoomStore();
    const code = store.create(host);
    store.set(code, playingRoom(code));
    const out = store.playAbility(code, 'h1', 'c1')!;
    expect(out.players.find((p) => p.id === 'h1')!.voteImmuneRound).toBe(1);
    expect(out.players.find((p) => p.id === 'h1')!.abilities![0].used).toBe(true);
  });

  it('adminAction: передача багажа между игроками', () => {
    const store = createRoomStore();
    const code = store.create(host);
    store.set(code, playingRoom(code));
    const out = store.adminAction(code, { type: 'transfer_baggage', fromId: 'h1', toId: 'p2' })!;
    const p2 = out.characters!.find((c) => c.playerId === 'p2')!;
    expect(p2.traits.baggage.text).toBe('Ружьё');
  });

  it('adminAction: правка бункера (крысы)', () => {
    const store = createRoomStore();
    const code = store.create(host);
    store.set(code, playingRoom(code));
    const out = store.adminAction(code, { type: 'patch_bunker', patch: { rats: true } })!;
    expect(out.bunker!.rats).toBe(true);
  });

  it('adminAction: выдать условие игроку', () => {
    const store = createRoomStore();
    const code = store.create(host);
    store.set(code, playingRoom(code));
    const out = store.adminAction(code, { type: 'add_condition', playerId: 'p2', text: 'Предатель' })!;
    expect(out.players.find((p) => p.id === 'p2')!.conditions).toContain('Предатель');
  });
});
