import { useEffect, useRef, useState } from 'react';
import type { Category, Player, RoomState } from './game/types';
import { memoryAdapter } from './net/memoryAdapter';
import { socketAdapter } from './net/socketAdapter';
import type { RoomAdapter } from './net/RoomAdapter';
import { adapterMode } from './net/selectAdapter';
import { initTelegram, getStartParam, getUserName, getUserId } from './telegram/tma';
import { startGame, addBot, autoRevealBots, autoVoteBots, resolveVote, finishGame } from './game/controller';
import { buildEndingInput } from './game/endings/input';
import { fallbackStory } from './game/endings/fallback';
import type { AdminAction as AdminActionType } from './game/admin';
import { Lobby } from './ui/Lobby';
import { RoundView } from './ui/RoundView';
import { VoteView } from './ui/VoteView';
import { EndingView } from './ui/EndingView';
import { Button, Screen } from './ui/kit';
import { theme } from './ui/theme';

const useMemory =
  adapterMode({ VITE_SERVER_URL: import.meta.env.VITE_SERVER_URL as string | undefined, DEV: import.meta.env.DEV }) ===
  'memory';
const adapter: RoomAdapter = useMemory ? memoryAdapter : socketAdapter;
const rng = () => Math.random();

export default function App() {
  const [me] = useState<Player>(() => ({ id: getUserId(), name: getUserName(), alive: true, revealed: [] }));
  const [room, setRoom] = useState<RoomState | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const unsub = useRef<null | (() => void)>(null);
  const codeRef = useRef<string>('');

  function watch(code: string) {
    codeRef.current = code;
    unsub.current?.();
    unsub.current = adapter.subscribe(code, setRoom);
  }

  useEffect(() => {
    initTelegram();
    const sp = getStartParam();
    if (sp) {
      adapter
        .joinRoom(sp, me)
        .then(() => watch(sp))
        .catch(() => undefined);
    }
    return () => unsub.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isHost = !!room && room.players[0]?.id === me.id;
  const mePlayer = room?.players.find((p) => p.id === me.id) ?? me;
  const push = (s: RoomState) => adapter.update(codeRef.current, s);

  const createRoom = async () => {
    const code = await adapter.createRoom(me);
    watch(code);
  };
  const joinRoom = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    try {
      await adapter.joinRoom(code, me);
      watch(code);
    } catch {
      alert('Комната не найдена');
    }
  };

  const onAddBot = () => room && push(addBot(room, rng));
  const onStart = () => room && push(autoRevealBots(startGame(room, rng), rng));
  const onReveal = (cat: Category) => room && adapter.reveal(codeRef.current, me.id, cat);
  const onToVote = () => room && push(autoVoteBots({ ...room, phase: 'vote', votes: {} }, rng));
  const onVote = (target: string) => room && adapter.vote(codeRef.current, me.id, target);
  const onPlayAbility = (cardId: string, targetId?: string) =>
    room && adapter.playAbility(codeRef.current, me.id, cardId, targetId);
  const onAdmin = (action: AdminActionType) => room && adapter.admin(codeRef.current, action);
  const onResolve = () => {
    if (!room) return;
    let s = resolveVote(room, rng);
    if (s.phase === 'ending') {
      s = finishGame(s, rng);
      // В одиночном (memory) режиме сервера нет — делаем историю локально (фоллбэк).
      if (useMemory) s = { ...s, story: fallbackStory(buildEndingInput(s)) };
    } else {
      s = autoRevealBots(s, rng);
    }
    push(s);
  };
  const onRestart = () =>
    room &&
    push({
      ...room,
      phase: 'lobby',
      round: 0,
      spots: 0,
      characters: undefined,
      scenario: undefined,
      ending: undefined,
      votes: {},
      players: room.players.map((p) => ({ ...p, alive: true, revealed: [] })),
    });

  if (!room) {
    return (
      <Screen>
        <h1 style={{ fontFamily: theme.font.display, fontSize: 34, margin: '24px 0 0' }}>Бункер</h1>
        <p style={{ color: theme.colors.dim, margin: 0 }}>
          Мир рушится. Соберите друзей, раскройте карты и решите, кто переживёт катастрофу.
        </p>
        <Button onClick={createRoom}>Создать комнату</Button>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Код комнаты"
            style={{
              flex: 1,
              minHeight: 48,
              padding: '0 14px',
              borderRadius: theme.radius.md,
              border: `1px solid ${theme.colors.line}`,
              background: theme.colors.panel,
              color: theme.colors.text,
              fontSize: 16,
              textTransform: 'uppercase',
            }}
          />
          <Button variant="ghost" onClick={joinRoom}>
            Войти
          </Button>
        </div>
      </Screen>
    );
  }

  switch (room.phase) {
    case 'lobby':
      return <Lobby state={room} me={mePlayer} isHost={isHost} onAddBot={onAddBot} onStart={onStart} />;
    case 'round':
      return (
        <RoundView
          state={room}
          me={mePlayer}
          isHost={isHost}
          onReveal={onReveal}
          onToVote={onToVote}
          onPlayAbility={onPlayAbility}
          onAdmin={onAdmin}
        />
      );
    case 'vote':
      return (
        <VoteView state={room} me={mePlayer} isHost={isHost} onVote={onVote} onResolve={onResolve} onAdmin={onAdmin} />
      );
    case 'ending':
      return <EndingView state={room} isHost={isHost} onRestart={onRestart} />;
  }
}
