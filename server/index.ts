import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRoomStore } from './store';
import type { Player, RoomState } from '../src/game/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });
const store = createRoomStore();

// Отдаём собранную статику SPA.
const dist = path.join(__dirname, '..', 'dist');
app.use(express.static(dist));
app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));

io.on('connection', (socket) => {
  socket.on('room:create', ({ host }: { host: Player }, ack?: (code: string) => void) => {
    const code = store.create(host);
    socket.join(code);
    ack?.(code);
    io.to(code).emit('room:state', store.get(code));
  });

  socket.on('room:join', ({ code, player }: { code: string; player: Player }, ack?: (r: RoomState | null) => void) => {
    const room = store.join(code, player);
    if (!room) {
      ack?.(null);
      return;
    }
    socket.join(code);
    ack?.(room);
    io.to(code).emit('room:state', room);
  });

  socket.on('room:watch', ({ code }: { code: string }) => {
    socket.join(code);
    const room = store.get(code);
    if (room) socket.emit('room:state', room);
  });

  socket.on('room:update', ({ code, state }: { code: string; state: RoomState }, ack?: () => void) => {
    store.set(code, state);
    io.to(code).emit('room:state', state);
    ack?.();
  });
});

const port = Number(process.env.PORT) || 8080;
httpServer.listen(port, () => console.log(`Бункер-сервер слушает :${port}`));
