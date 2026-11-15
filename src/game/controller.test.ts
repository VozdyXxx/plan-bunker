import { test, expect, describe, it } from 'vitest';
import { startGame, revealTrait, castVote, resolveVote, finishGame, addBot, autoVoteBots } from './controller';
import type { AbilityCard, Player, RoomState } from './types';

function seededRng(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}
function players(n: number): Player[] {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, alive: true, revealed: [] }));
}
function baseRoom(n: number): RoomState {
  return { code: 'A', phase: 'lobby', round: 0, players: players(n), scenarioId: null, spots: 0 };
}

test('startGame deals a character to each player and sets the scenario and spots', () => {
  const s = startGame(baseRoom(5), seededRng(1));
  expect(s.phase).toBe('round');
  expect(s.characters).toHaveLength(5);
  expect(s.scenario).toBeTruthy();
  expect(s.spots).toBe(2);
});

test('revealTrait records the category for the player', () => {
  let s = startGame(baseRoom(4), seededRng(2));
  s = revealTrait(s, 'p0', 'profession');
  expect(s.players.find((p) => p.id === 'p0')!.revealed).toContain('profession');
});

test('resolveVote eliminates the most-voted player', () => {
  let s = startGame(baseRoom(4), seededRng(3));
  s = { ...s, phase: 'vote' };
  s = castVote(s, 'p0', 'p1');
  s = castVote(s, 'p2', 'p1');
  s = castVote(s, 'p3', 'p0');
  s = resolveVote(s);
  expect(s.players.find((p) => p.id === 'p1')!.alive).toBe(false);
  expect(s.votes).toEqual({});
});

test('finishGame produces an ending from the survivors', () => {
  let s = startGame(baseRoom(4), seededRng(4));
  s = finishGame(s, seededRng(4));
  expect(s.phase).toBe('ending');
  expect(s.ending!.narrative.length).toBeGreaterThan(0);
});

test('addBot appends a bot player', () => {
  const s = addBot(baseRoom(2), seededRng(9));
  expect(s.players).toHaveLength(3);
  expect(s.players[2].isBot).toBe(true);
});

test('autoVoteBots makes every alive bot vote for an alive player other than itself', () => {
  let s = startGame(addBot(addBot(baseRoom(1), seededRng(5)), seededRng(6)), seededRng(7));
  s = { ...s, phase: 'vote', votes: {} };
  s = autoVoteBots(s, seededRng(8));
  const bots = s.players.filter((p) => p.isBot && p.alive);
  for (const b of bots) {
    expect(s.votes![b.id]).toBeDefined();
    expect(s.votes![b.id]).not.toBe(b.id);
  }
});

describe('v2: интеграция сценария и навыков', () => {
  it('startGame кладёт бункер/катастрофу/место и выдаёт по 2 навыка', () => {
    const s = startGame(baseRoom(6), seededRng(11));
    expect(s.bunker).toBeTruthy();
    expect(s.bunker!.rooms.length).toBeGreaterThan(0);
    expect(s.catastrophe!.title.length).toBeGreaterThan(0);
    expect(s.place!.title.length).toBeGreaterThan(0);
    for (const p of s.players) expect(p.abilities).toHaveLength(2);
  });

  function card(kind: AbilityCard['kind'], mechanic: AbilityCard['mechanic']): AbilityCard {
    return { id: `c-${mechanic}`, kind, mechanic, title: 'T', text: 'T', used: false };
  }

  it('у изгнанного срабатывает on_eliminated, у выжившего on_survived при финале', () => {
    const base = startGame(baseRoom(2), seededRng(12));
    // Готовим детерминированный финал: spots=1, известные карты.
    const s: RoomState = {
      ...base,
      phase: 'vote',
      spots: 1,
      bunker: { ...base.bunker!, rats: false, drugs: false, spots: 1 },
      players: [
        { ...base.players[0], id: 'a', alive: true, abilities: [card('on_survived', 'drugs')] },
        { ...base.players[1], id: 'b', alive: true, abilities: [card('on_eliminated', 'rats')] },
      ],
      votes: { a: 'b', b: 'b' },
    };
    const out = resolveVote(s, () => 0);
    expect(out.players.find((p) => p.id === 'b')!.alive).toBe(false);
    expect(out.phase).toBe('ending');
    expect(out.bunker!.rats).toBe(true); // on_eliminated у «b»
    expect(out.bunker!.drugs).toBe(true); // on_survived у выжившего «a»
  });
});
