import type { AbilityCard, Player, RoomState, Category } from './types';
import { CATEGORIES } from './types';
import abilitiesJson from './content/abilities.json';
import { pickDistinct } from './rng';

const ALL = abilitiesJson as unknown as AbilityCard[];

export function loadAbilities(): AbilityCard[] {
  return ALL;
}

/** Две случайные различные карты навыков игроку. */
export function dealAbilities(rng: () => number): AbilityCard[] {
  return pickDistinct(ALL, 2, rng).map((c) => ({ ...c, used: false }));
}

function clone<T>(x: T): T {
  return structuredClone(x);
}
function findPlayer(s: RoomState, id: string): Player | undefined {
  return s.players.find((p) => p.id === id);
}
function charOf(s: RoomState, id: string) {
  return s.characters?.find((c) => c.playerId === id);
}

/** Применяет эффект одной механики к (клонированному) состоянию. */
function applyMechanic(
  s: RoomState,
  mechanic: AbilityCard['mechanic'],
  actorId: string,
  targetId: string | undefined,
  params: Record<string, number> | undefined,
  rng: () => number,
): void {
  const actor = findPlayer(s, actorId);
  const target = targetId ? findPlayer(s, targetId) : undefined;
  const b = s.bunker;

  switch (mechanic) {
    // ---- активные ----
    case 'vote_immune':
      if (actor) actor.voteImmuneRound = s.round;
      break;
    case 'protect':
      if (target) target.voteImmuneRound = s.round;
      break;
    case 'steal_ability':
      if (actor && target && target.abilities && target.abilities.length) {
        const idx = target.abilities.findIndex((c) => !c.used);
        const take = idx >= 0 ? idx : 0;
        const [card] = target.abilities.splice(take, 1);
        actor.abilities = [...(actor.abilities ?? []), { ...card, used: false }];
      }
      break;
    case 'swap_card': {
      const a = actor && charOf(s, actor.id);
      const t = target && charOf(s, target.id);
      if (a && t) {
        const tmp = a.traits.baggage;
        a.traits.baggage = t.traits.baggage;
        t.traits.baggage = tmp;
      }
      break;
    }
    case 'peek':
      break; // информация раскрывается на клиенте, состояние не меняется
    case 'double_vote':
      if (actor) actor.conditions = [...(actor.conditions ?? []), `double_vote:${s.round}`];
      break;
    case 'cancel_vote':
      if (s.votes) for (const [voter, tgt] of Object.entries(s.votes)) if (tgt === actorId) delete s.votes[voter];
      break;
    case 'force_reveal': {
      const t = target && charOf(s, target.id);
      if (target && t) {
        const next = (CATEGORIES as readonly Category[]).find((c) => !target.revealed.includes(c));
        if (next) target.revealed = [...target.revealed, next];
      }
      break;
    }
    case 'draw_ability':
      if (actor) {
        const [card] = pickDistinct(ALL, 1, rng);
        if (card) actor.abilities = [...(actor.abilities ?? []), { ...card, used: false }];
      }
      break;
    case 'swap_players_votes':
      if (s.votes && target)
        for (const voter of Object.keys(s.votes)) {
          if (s.votes[voter] === actorId) s.votes[voter] = target.id;
          else if (s.votes[voter] === target.id) s.votes[voter] = actorId;
        }
      break;

    // ---- при вылете ----
    case 'rats':
      if (b) b.rats = true;
      break;
    case 'break_generator':
      if (b) b.brokenGenerator = true;
      break;
    case 'drag_random': {
      const others = s.players.filter((p) => p.alive && p.id !== actorId);
      if (others.length) {
        const victim = pickDistinct(others, 1, rng)[0];
        const p = findPlayer(s, victim.id);
        if (p) p.alive = false;
      }
      break;
    }
    case 'revote':
      s.pendingRevote = true;
      break;
    case 'take_baggage':
      if (b && b.findings.length) b.findings = b.findings.slice(0, -1);
      break;
    case 'leave_disease':
      if (b) b.contaminated = true;
      break;
    case 'jam_door':
      if (b) b.spots = Math.max(1, b.spots - 1);
      break;

    // ---- при проходе ----
    case 'drugs':
      if (b) b.drugs = true;
      break;
    case 'extra_spot':
      if (b) b.spots += 1;
      break;
    case 'extra_food':
      if (b) b.extraFood += params?.food ?? 12;
      break;
    case 'secret_contagious':
      if (b) b.contaminated = true;
      break;
    case 'unlock_room':
      if (b) {
        const room = b.rooms.find((r) => r.locked);
        if (room) room.locked = false;
      }
      break;
    case 'bring_animal':
      if (b) {
        b.extraFood += 3;
        b.findings = [...b.findings, 'Приручённое животное'];
      }
      break;
  }
}

/** Игрок играет активную карту. Возвращает новое состояние. */
export function applyActive(
  state: RoomState,
  playerId: string,
  cardId: string,
  targetId?: string,
  rng: () => number = Math.random,
): RoomState {
  const s = clone(state);
  const actor = findPlayer(s, playerId);
  const card = actor?.abilities?.find((c) => c.id === cardId);
  if (!actor || !card || card.kind !== 'active' || card.used) return s;
  applyMechanic(s, card.mechanic, playerId, targetId, card.params, rng);
  card.used = true;
  return s;
}

function applyTriggered(state: RoomState, playerId: string, kind: 'on_eliminated' | 'on_survived', rng: () => number): RoomState {
  let s = clone(state);
  const actor = findPlayer(s, playerId);
  if (!actor?.abilities) return s;
  for (const card of actor.abilities) {
    if (card.kind === kind && !card.used) {
      applyMechanic(s, card.mechanic, playerId, undefined, card.params, rng);
      card.used = true;
    }
  }
  return s;
}

export function applyOnEliminated(state: RoomState, player: Player, rng: () => number = Math.random): RoomState {
  return applyTriggered(state, player.id, 'on_eliminated', rng);
}

export function applyOnSurvived(state: RoomState, player: Player, rng: () => number = Math.random): RoomState {
  return applyTriggered(state, player.id, 'on_survived', rng);
}
