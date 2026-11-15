import type { Player, RoomState } from '../game/types';

/** Единый интерфейс сетевого слоя: и память (локально), и websocket (боевой). */
export interface RoomAdapter {
  createRoom(host: Player): Promise<string>;
  joinRoom(code: string, player: Player): Promise<RoomState>;
  subscribe(code: string, cb: (s: RoomState) => void): () => void;
  update(code: string, state: RoomState): Promise<void>;
}
