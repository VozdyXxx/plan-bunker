import type { RoomState, Category, Trait, BunkerState } from './types';
import { dealAbilities } from './abilities';

/** Админ-действия (god-mode). Все изменения авторитетны и применяются на сервере. */
export type AdminAction =
  | { type: 'replace_trait'; playerId: string; category: Category; text: string; tags?: string[] }
  | { type: 'set_baggage'; playerId: string; text: string }
  | { type: 'transfer_baggage'; fromId: string; toId: string }
  | { type: 'add_condition'; playerId: string; text: string }
  | { type: 'grant_ability'; playerId: string }
  | { type: 'revoke_ability'; playerId: string; cardId: string }
  | { type: 'patch_bunker'; patch: Partial<BunkerState> }
  | { type: 'kick'; playerId: string };

function clone<T>(x: T): T {
  return structuredClone(x);
}

/** Применяет админ-действие к состоянию, возвращает новое состояние. */
export function applyAdmin(state: RoomState, action: AdminAction, rng: () => number = Math.random): RoomState {
  const s = clone(state);
  const player = (id: string) => s.players.find((p) => p.id === id);
  const charOf = (id: string) => s.characters?.find((c) => c.playerId === id);

  switch (action.type) {
    case 'replace_trait': {
      const ch = charOf(action.playerId);
      if (ch) {
        const t: Trait = { id: `admin-${Date.now()}`, category: action.category, text: action.text, tags: action.tags ?? [] };
        ch.traits[action.category] = t;
      }
      break;
    }
    case 'set_baggage': {
      const ch = charOf(action.playerId);
      if (ch) ch.traits.baggage = { id: `admin-${Date.now()}`, category: 'baggage', text: action.text, tags: [] };
      break;
    }
    case 'transfer_baggage': {
      const from = charOf(action.fromId);
      const to = charOf(action.toId);
      if (from && to) {
        to.traits.baggage = from.traits.baggage;
        from.traits.baggage = { id: `admin-${Date.now()}`, category: 'baggage', text: 'Пустые руки', tags: [] };
      }
      break;
    }
    case 'add_condition': {
      const p = player(action.playerId);
      if (p) p.conditions = [...(p.conditions ?? []), action.text];
      break;
    }
    case 'grant_ability': {
      const p = player(action.playerId);
      if (p) p.abilities = [...(p.abilities ?? []), ...dealAbilities(rng).slice(0, 1)];
      break;
    }
    case 'revoke_ability': {
      const p = player(action.playerId);
      if (p?.abilities) p.abilities = p.abilities.filter((c) => c.id !== action.cardId);
      break;
    }
    case 'patch_bunker': {
      if (s.bunker) s.bunker = { ...s.bunker, ...action.patch };
      break;
    }
    case 'kick': {
      const p = player(action.playerId);
      if (p) p.alive = false;
      break;
    }
  }
  return s;
}
