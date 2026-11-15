import type { Category, Player, RoomState } from '../game/types';
import { Button, Screen, ScenarioBanner } from './kit';
import { TraitReveal } from './TraitReveal';
import { BunkerPanel } from './BunkerPanel';
import { AbilityBar } from './AbilityBar';
import { AdminPanel } from './AdminPanel';
import type { AdminAction } from '../game/admin';
import { theme } from './theme';

interface Props {
  state: RoomState;
  me: Player;
  isHost: boolean;
  onReveal: (category: Category) => void;
  onToVote: () => void;
  onPlayAbility: (cardId: string, targetId?: string) => void;
  onAdmin: (action: AdminAction) => void;
}

export function RoundView({ state, me, isHost, onReveal, onToVote, onPlayAbility, onAdmin }: Props) {
  const alive = state.players.filter((p) => p.alive);
  const charOf = (id: string) => state.characters?.find((c) => c.playerId === id);

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

      <BunkerPanel catastrophe={state.catastrophe} place={state.place} bunker={state.bunker} />

      {isHost && <AdminPanel state={state} onAdmin={onAdmin} />}

      <AbilityBar me={me} players={state.players} onPlay={onPlayAbility} />

      <p style={{ color: theme.colors.dim, margin: 0, fontSize: 14 }}>
        Раскрывайте свои карты и спорьте, почему именно вы достойны места.
      </p>

      {alive.map((p) => {
        const ch = charOf(p.id);
        if (!ch) return null;
        const own = p.id === me.id;
        return (
          <section key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h3 style={{ fontFamily: theme.font.display, margin: '4px 0', fontSize: 16 }}>
              {p.name} {own && <span style={{ color: theme.colors.neon, fontSize: 13 }}>— это вы</span>}
            </h3>
            <TraitReveal character={ch} player={p} own={own} onReveal={own ? onReveal : undefined} />
          </section>
        );
      })}

      {isHost && (
        <Button onClick={onToVote} style={{ position: 'sticky', bottom: 8 }}>
          Перейти к голосованию
        </Button>
      )}
    </Screen>
  );
}
