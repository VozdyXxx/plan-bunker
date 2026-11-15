import type { Category, Player, RoomState } from '../game/types';
import { Button, Screen, ScenarioBanner } from './kit';
import { TraitReveal } from './TraitReveal';
import { theme } from './theme';

interface Props {
  state: RoomState;
  me: Player;
  isHost: boolean;
  onReveal: (category: Category) => void;
  onToVote: () => void;
}

export function RoundView({ state, me, isHost, onReveal, onToVote }: Props) {
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
