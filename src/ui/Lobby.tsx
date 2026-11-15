import type { Player, RoomState } from '../game/types';
import { Button, Screen } from './kit';
import { theme } from './theme';
import { roomLink, shareRoom } from '../telegram/tma';

interface Props {
  state: RoomState;
  me: Player;
  isHost: boolean;
  onAddBot: () => void;
  onStart: () => void;
}

export function Lobby({ state, me, isHost, onAddBot, onStart }: Props) {
  const canStart = state.players.length >= 2;
  return (
    <Screen>
      <h1 style={{ fontFamily: theme.font.display, fontSize: 30, margin: 0 }}>Бункер</h1>
      <p style={{ color: theme.colors.dim, margin: 0 }}>
        Катастрофа близко. Решите, кто достоин места за толстой дверью.
      </p>

      <div
        style={{
          border: `1px solid ${theme.colors.line}`,
          borderRadius: theme.radius.md,
          background: theme.colors.panel,
          padding: 16,
        }}
      >
        <div style={{ fontSize: 13, color: theme.colors.dim }}>Код комнаты</div>
        <div style={{ fontFamily: theme.font.display, fontSize: 34, letterSpacing: '.18em', color: theme.colors.gold }}>
          {state.code}
        </div>
        <div style={{ fontSize: 12, color: theme.colors.dim, wordBreak: 'break-all', marginTop: 4 }}>
          {roomLink(state.code)}
        </div>
        <div style={{ marginTop: 12 }}>
          <Button variant="ghost" onClick={() => shareRoom(state.code)}>
            Пригласить друга
          </Button>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, color: theme.colors.dim, marginBottom: 8 }}>
          Игроки ({state.players.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {state.players.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                borderRadius: theme.radius.sm,
                background: theme.colors.panelHi,
                border: `1px solid ${theme.colors.line}`,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 8, background: theme.colors.neon }} />
              <span>{p.name}</span>
              {p.id === me.id && <span style={{ color: theme.colors.dim, fontSize: 12 }}>(вы)</span>}
              {p.isBot && <span style={{ color: theme.colors.dim, fontSize: 12 }}>бот</span>}
            </div>
          ))}
        </div>
      </div>

      {isHost ? (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="ghost" onClick={onAddBot}>
            Добавить бота
          </Button>
          <Button onClick={onStart} disabled={!canStart} style={{ flex: 1 }}>
            {canStart ? 'Начать игру' : 'Нужно хотя бы 2 игрока'}
          </Button>
        </div>
      ) : (
        <div style={{ color: theme.colors.dim }}>Ждём, пока хост начнёт игру…</div>
      )}
    </Screen>
  );
}
