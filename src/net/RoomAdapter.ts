import type { Category, Player, RoomState } from '../game/types';

/** Единый интерфейс сетевого слоя: и память (локально), и websocket (боевой). */
export interface RoomAdapter {
  createRoom(host: Player): Promise<string>;
  joinRoom(code: string, player: Player): Promise<RoomState>;
  subscribe(code: string, cb: (s: RoomState) => void): () => void;
  /** Полная замена состояния — только для действий хоста (старт, фазы, боты). */
  update(code: string, state: RoomState): Promise<void>;
  /** Гранулярный голос игрока — мёржится на сервере, без гонки перезаписи. */
  vote(code: string, voterId: string, targetId: string): Promise<void>;
  /** Гранулярное раскрытие своей карты. */
  reveal(code: string, playerId: string, category: Category): Promise<void>;
}
