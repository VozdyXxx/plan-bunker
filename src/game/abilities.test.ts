import { describe, it, expect } from 'vitest';
import abilitiesJson from './content/abilities.json';
import { loadAbilities, dealAbilities, applyActive, applyOnEliminated, applyOnSurvived } from './abilities';
import { ABILITY_MECHANICS, type AbilityCard, type RoomState, type BunkerState } from './types';
import { mulberry32 } from './rng';

describe('контент карт навыков', () => {
  const all = abilitiesJson as unknown as AbilityCard[];
  it('по ≥100 карт на каждый вид', () => {
    for (const kind of ['active', 'on_eliminated', 'on_survived']) {
      expect(all.filter((c) => c.kind === kind).length, kind).toBeGreaterThanOrEqual(100);
    }
  });
  it('все механики из допустимого списка, id уникальны', () => {
    const ids = new Set(all.map((c) => c.id));
    expect(ids.size).toBe(all.length);
    for (const c of all) expect((ABILITY_MECHANICS as readonly string[]).includes(c.mechanic)).toBe(true);
  });
});

describe('раздача', () => {
  it('выдаёт 2 различные карты', () => {
    const cards = dealAbilities(mulberry32(5));
    expect(cards).toHaveLength(2);
    expect(cards[0].id).not.toBe(cards[1].id);
    expect(cards.every((c) => c.used === false)).toBe(true);
  });
});

function bunker(): BunkerState {
  return {
    years: 3,
    foodMonths: 12,
    waterMonths: 12,
    spots: 2,
    rooms: [{ id: 'medbay', name: 'Медотсек', locked: true, unlockTag: 'doctor' }],
    findings: ['Канистры с дизелем'],
    rats: false,
    brokenGenerator: false,
    extraFood: 0,
    drugs: false,
  };
}
function room(extra: Partial<RoomState> = {}): RoomState {
  return {
    code: 'ABCD',
    phase: 'round',
    round: 1,
    players: [
      { id: 'a', name: 'Аня', alive: true, revealed: [], abilities: [] },
      { id: 'b', name: 'Боря', alive: true, revealed: [], abilities: [] },
    ],
    scenarioId: null,
    spots: 2,
    bunker: bunker(),
    votes: {},
    ...extra,
  };
}
function withCard(kind: AbilityCard['kind'], mechanic: AbilityCard['mechanic'], params?: Record<string, number>): AbilityCard {
  return { id: `t-${mechanic}`, kind, mechanic, title: 'T', text: 'T', used: false, params };
}

describe('движок навыков', () => {
  const rng = () => 0;

  it('rats ставит крыс в бункере (on_eliminated)', () => {
    const s = room();
    s.players[0].abilities = [withCard('on_eliminated', 'rats')];
    const out = applyOnEliminated(s, s.players[0], rng);
    expect(out.bunker!.rats).toBe(true);
    expect(out.players[0].abilities![0].used).toBe(true);
  });

  it('extra_spot добавляет место (on_survived)', () => {
    const s = room();
    s.players[0].abilities = [withCard('on_survived', 'extra_spot')];
    const out = applyOnSurvived(s, s.players[0], rng);
    expect(out.bunker!.spots).toBe(3);
  });

  it('drugs помечает наркотики (on_survived)', () => {
    const s = room();
    s.players[0].abilities = [withCard('on_survived', 'drugs')];
    const out = applyOnSurvived(s, s.players[0], rng);
    expect(out.bunker!.drugs).toBe(true);
  });

  it('vote_immune защищает игрока на раунд (active)', () => {
    const s = room();
    s.players[0].abilities = [withCard('active', 'vote_immune')];
    const out = applyActive(s, 'a', 't-vote_immune');
    expect(out.players[0].voteImmuneRound).toBe(1);
  });

  it('steal_ability переносит карту от цели к кастеру (active)', () => {
    const s = room();
    s.players[0].abilities = [withCard('active', 'steal_ability')];
    s.players[1].abilities = [withCard('on_survived', 'extra_food', { food: 12 })];
    const out = applyActive(s, 'a', 't-steal_ability', 'b');
    expect(out.players[1].abilities!.length).toBe(0);
    expect(out.players[0].abilities!.some((c) => c.mechanic === 'extra_food')).toBe(true);
  });

  it('use-флаг идемпотентен: повторная игра карты ничего не меняет', () => {
    const s = room();
    s.players[0].abilities = [withCard('on_survived', 'extra_spot')];
    const once = applyOnSurvived(s, s.players[0], rng);
    const twice = applyOnSurvived(once, once.players[0], rng);
    expect(twice.bunker!.spots).toBe(3); // не выросло второй раз
  });

  it('loadAbilities возвращает общий пул', () => {
    expect(loadAbilities().length).toBeGreaterThanOrEqual(300);
  });
});
