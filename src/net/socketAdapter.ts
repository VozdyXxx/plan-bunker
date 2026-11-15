import { io, type Socket } from 'socket.io-client';
import type { RoomAdapter } from './RoomAdapter';
import type { RoomState } from '../game/types';

const URL = (import.meta.env.VITE_SERVER_URL as string) || '';

let socket: Socket | null = null;
function sock(): Socket {
  if (!socket) socket = io(URL, { transports: ['websocket'] });
  return socket;
}

export const socketAdapter: RoomAdapter = {
  createRoom(host) {
    return new Promise((resolve) => sock().emit('room:create', { host }, (code: string) => resolve(code)));
  },
  joinRoom(code, player) {
    return new Promise((resolve, reject) =>
      sock().emit('room:join', { code, player }, (room: RoomState | null) =>
        room ? resolve(room) : reject(new Error('Комната не найдена')),
      ),
    );
  },
  subscribe(code, cb) {
    const s = sock();
    const handler = (state: RoomState) => {
      if (state.code === code) cb(state);
    };
    s.on('room:state', handler);
    s.emit('room:watch', { code });
    return () => {
      s.off('room:state', handler);
    };
  },
  update(code, state) {
    return new Promise((resolve) => sock().emit('room:update', { code, state }, () => resolve()));
  },
  vote(code, voterId, targetId) {
    return new Promise((resolve) => sock().emit('room:vote', { code, voterId, targetId }, () => resolve()));
  },
  reveal(code, playerId, category) {
    return new Promise((resolve) => sock().emit('room:reveal', { code, playerId, category }, () => resolve()));
  },
};
