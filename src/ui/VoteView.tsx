import type { Player, RoomState } from '../game/types';
import { Button, Screen, ScenarioBanner } from './kit';
import { theme } from './theme';

interface Props {
  state: RoomState;
  me: Player;
  isHost: boolean;
  onVote: (targetId: string) => void;
  onResolve: () => void;
}

export function VoteView({ state, me, isHost, onVote, onResolve }: Props) {
  const alive = state.players.filter((p) => p.alive);
  const votes = state.votes ?? {};
  const myVote = votes[me.id];
  const tally = (id: string) => Object.values(votes).filter((t) => t === id).length;

  return (
    <Screen>
      {state.scenario && (
        <ScenarioBanner
          title={state.scenario.title}
          years={state.scenario.years}
          spots={state.spots}
          alive={alive.length}
          conditions={state.scenario.conditions}
          round={state.round}
        />
      )}
      <h2 style={{ fontFamily: theme.font.display, margin: '4px 0' }}>Кого выгоняем?</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {alive.map((p) => {
          const mine = myVote === p.id;
          const count = tally(p.id);
          const self = p.id === me.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => !self && onVote(p.id)}
              disabled={self}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                minHeight: 52,
                padding: '0 14px',
                borderRadius: theme.radius.md,
                border: `1px solid ${mine ? theme.colors.emergency : theme.colors.line}`,
                background: mine ? 'rgba(255,90,60,0.12)' : theme.colors.panel,
                color: self ? theme.colors.dim : theme.colors.text,
                cursor: self ? 'not-allowed' : 'pointer',
                fontSize: 15,
              }}
            >
              <span>
                {p.name} {self && '(вы)'}
              </span>
              <span style={{ color: theme.colors.gold, fontVariantNumeric: 'tabular-nums' }}>
                {count > 0 ? `${count} голос.` : ''}
              </span>
            </button>
          );
        })}
      </div>

      {isHost && (
        <Button variant="danger" onClick={onResolve} style={{ position: 'sticky', bottom: 8 }}>
          Подвести итог
        </Button>
      )}
    </Screen>
  );
}
