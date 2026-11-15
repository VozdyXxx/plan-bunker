import { createRoomStore } from '../../server/store';
import type { RoomAdapter } from './RoomAdapter';
import type { RoomState } from '../game/types';

// Локальный адаптер поверх того же чистого хранилища, что и сервер.
// Для разработки и тестов UI без запущенного бэкенда (в пределах одной вкладки).
const store = createRoomStore();
const subs = new Map<string, Set<(s: RoomState) => void>>();

function emit(code: string) {
  const room = store.get(code);
  if (!room) return;
  subs.get(code)?.forEach((cb) => cb(structuredClone(room)));
}

export const memoryAdapter: RoomAdapter = {
  async createRoom(host) {
    return store.create(host);
  },
  async joinRoom(code, player) {
    const room = store.join(code, player);
    if (!room) throw new Error('Комната не найдена');
    emit(code);
    return structuredClone(room);
  },
  subscribe(code, cb) {
    if (!subs.has(code)) subs.set(code, new Set());
    subs.get(code)!.add(cb);
    const room = store.get(code);
    if (room) cb(structuredClone(room));
    return () => subs.get(code)?.delete(cb);
  },
  async update(code, state) {
    store.set(code, state);
    emit(code);
  },
  async vote(code, voterId, targetId) {
    store.vote(code, voterId, targetId);
    emit(code);
  },
  async reveal(code, playerId, category) {
    store.reveal(code, playerId, category);
    emit(code);
  },
};
