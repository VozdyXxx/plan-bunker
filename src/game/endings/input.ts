import type { RoomState, Character, Player, Category } from '../types';
import { CATEGORIES } from '../types';
import { computeFactors } from './factors';
import type { EndingInput, PlayerCard } from './fallback';

function playerCard(p: Player, ch: Character | undefined): PlayerCard {
  const traits: string[] = [];
  const hidden: string[] = [];
  if (ch) {
    for (const cat of CATEGORIES as readonly Category[]) {
      const t = ch.traits[cat];
      if (!t) continue;
      if (p.revealed.includes(cat)) traits.push(t.text);
      else hidden.push(t.text);
    }
  }
  return { name: p.name, traits, hidden, abilities: (p.abilities ?? []).map((a) => a.title) };
}

/** Собирает вход для генератора концовки из состояния комнаты. */
export function buildEndingInput(state: RoomState): EndingInput {
  const chars = state.characters ?? [];
  const charOf = (id: string) => chars.find((c) => c.playerId === id);
  const alive = state.players.filter((p) => p.alive);
  const dead = state.players.filter((p) => !p.alive);

  const survivorsChars = alive.map((p) => charOf(p.id)).filter((c): c is Character => !!c);
  const exiledChars = dead.map((p) => charOf(p.id)).filter((c): c is Character => !!c);

  const catastrophe = state.catastrophe ?? { id: 'unknown', title: 'Катастрофа', text: 'Мир изменился навсегда.' };
  const place = state.place ?? { id: 'unknown', title: 'Убежище', text: 'Тесное укрытие под землёй.' };
  const bunker = state.bunker ?? {
    years: 1,
    foodMonths: 1,
    waterMonths: 1,
    spots: state.spots,
    rooms: [],
    findings: [],
    rats: false,
    brokenGenerator: false,
    extraFood: 0,
    drugs: false,
  };

  const facts = computeFactors(survivorsChars, exiledChars, bunker, catastrophe);

  return {
    catastrophe,
    place,
    survivors: alive.map((p) => playerCard(p, charOf(p.id))),
    exiled: dead.map((p) => playerCard(p, charOf(p.id))),
    facts,
  };
}
