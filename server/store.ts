import type { Category, Player, RoomState } from '../src/game/types';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // без похожих символов

function randomCode(len = 5): string {
  let s = '';
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

function normalizePlayer(p: Player): Player {
  return { id: p.id, name: p.name, alive: true, revealed: [] };
}

export interface RoomStore {
  create(host: Player): string;
  join(code: string, player: Player): RoomState | undefined;
  get(code: string): RoomState | undefined;
  set(code: string, state: RoomState): void;
  /** Гранулярный мёрж голоса — не перезаписывает чужие голоса. */
  vote(code: string, voterId: string, targetId: string): RoomState | undefined;
  /** Гранулярное раскрытие карты — без перезаписи всего состояния. */
  reveal(code: string, playerId: string, category: Category): RoomState | undefined;
}

/** Чистое in-memory хранилище комнат. Без сети и сторонних зависимостей. */
export function createRoomStore(): RoomStore {
  const rooms = new Map<string, RoomState>();

  function makeUniqueCode(): string {
    let code = randomCode();
    while (rooms.has(code)) code = randomCode();
    return code;
  }

  return {
    create(host: Player): string {
      const code = makeUniqueCode();
      rooms.set(code, {
        code,
        phase: 'lobby',
        round: 0,
        players: [normalizePlayer(host)],
        scenarioId: null,
        spots: 0,
      });
      return code;
    },
    join(code: string, player: Player): RoomState | undefined {
      const room = rooms.get(code);
      if (!room) return undefined;
      if (!room.players.some((p) => p.id === player.id)) {
        room.players.push(normalizePlayer(player));
      }
      return room;
    },
    get(code: string): RoomState | undefined {
      return rooms.get(code);
    },
    set(code: string, state: RoomState): void {
      rooms.set(code, state);
    },
    vote(code: string, voterId: string, targetId: string): RoomState | undefined {
      const room = rooms.get(code);
      if (!room) return undefined;
      room.votes = { ...(room.votes ?? {}), [voterId]: targetId };
      return room;
    },
    reveal(code: string, playerId: string, category: Category): RoomState | undefined {
      const room = rooms.get(code);
      if (!room) return undefined;
      room.players = room.players.map((p) =>
        p.id === playerId && !p.revealed.includes(category) ? { ...p, revealed: [...p.revealed, category] } : p,
      );
      return room;
    },
  };
}
