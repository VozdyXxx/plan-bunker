import 'dotenv/config';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRoomStore } from './store';
import type { Category, Player, RoomState } from '../src/game/types';
import type { AdminAction } from '../src/game/admin';
import { buildEndingInput } from '../src/game/endings/input';
import { renderEnding } from './ending-ai';

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
    // Если дошли до финала и ИИ-истории ещё нет — генерируем её и дорассылаем.
    if (state.phase === 'ending' && !state.story) {
      renderEnding(buildEndingInput(state))
        .then((story) => {
          const room = store.get(code);
          if (!room) return;
          const enriched = { ...room, story };
          store.set(code, enriched);
          io.to(code).emit('room:state', enriched);
        })
        .catch((e) => console.error('ending render failed', e));
    }
  });

  socket.on(
    'room:ability',
    (
      { code, playerId, cardId, targetId }: { code: string; playerId: string; cardId: string; targetId?: string },
      ack?: () => void,
    ) => {
      const room = store.playAbility(code, playerId, cardId, targetId);
      if (room) io.to(code).emit('room:state', room);
      ack?.();
    },
  );

  socket.on('room:admin', ({ code, action }: { code: string; action: AdminAction }, ack?: () => void) => {
    const room = store.adminAction(code, action);
    if (room) io.to(code).emit('room:state', room);
    ack?.();
  });

  socket.on(
    'room:vote',
    ({ code, voterId, targetId }: { code: string; voterId: string; targetId: string }, ack?: () => void) => {
      const room = store.vote(code, voterId, targetId);
      if (room) io.to(code).emit('room:state', room);
      ack?.();
    },
  );

  socket.on(
    'room:reveal',
    ({ code, playerId, category }: { code: string; playerId: string; category: Category }, ack?: () => void) => {
      const room = store.reveal(code, playerId, category);
      if (room) io.to(code).emit('room:state', room);
      ack?.();
    },
  );
});

const port = Number(process.env.PORT) || 8080;
httpServer.listen(port, () => console.log(`Бункер-сервер слушает :${port}`));
