import { describe, it, expect } from 'vitest';
import { applyAdmin } from './admin';
import type { RoomState, Character, AbilityCard } from './types';

function charBaggage(playerId: string, text: string): Character {
  return { playerId, traits: { baggage: { id: `b-${playerId}`, category: 'baggage', text, tags: [] } } as unknown as Character['traits'] };
}
const ability: AbilityCard = { id: 'a1', kind: 'active', mechanic: 'peek', title: 'T', text: 'T', used: false };

function room(): RoomState {
  return {
    code: 'A',
    phase: 'round',
    round: 1,
    players: [{ id: 'p1', name: 'П1', alive: true, revealed: [], abilities: [ability], conditions: [] }],
    scenarioId: 'x',
    spots: 1,
    characters: [charBaggage('p1', 'Гитара')],
    bunker: { years: 1, foodMonths: 1, waterMonths: 1, spots: 1, rooms: [], findings: [], rats: false, brokenGenerator: false, extraFood: 0, drugs: false },
  };
}

describe('applyAdmin', () => {
  it('replace_trait заменяет характеристику', () => {
    const out = applyAdmin(room(), { type: 'replace_trait', playerId: 'p1', category: 'baggage', text: 'Аптечка' });
    expect(out.characters![0].traits.baggage.text).toBe('Аптечка');
  });
  it('revoke_ability убирает карту', () => {
    const out = applyAdmin(room(), { type: 'revoke_ability', playerId: 'p1', cardId: 'a1' });
    expect(out.players[0].abilities).toHaveLength(0);
  });
  it('grant_ability добавляет карту', () => {
    const out = applyAdmin(room(), { type: 'grant_ability', playerId: 'p1' }, () => 0);
    expect(out.players[0].abilities!.length).toBe(2);
  });
  it('kick убивает игрока', () => {
    const out = applyAdmin(room(), { type: 'kick', playerId: 'p1' });
    expect(out.players[0].alive).toBe(false);
  });
  it('не мутирует исходное состояние', () => {
    const s = room();
    applyAdmin(s, { type: 'kick', playerId: 'p1' });
    expect(s.players[0].alive).toBe(true);
  });
});
