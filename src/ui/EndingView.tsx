import { useEffect, useRef } from 'react';
import type { RoomState } from '../game/types';
import { Button, Screen } from './kit';
import { theme } from './theme';
import { anim } from './animations';

interface Props {
  state: RoomState;
  isHost: boolean;
  onRestart: () => void;
}

export function EndingView({ state, isHost, onRestart }: Props) {
  const survivors = state.players.filter((p) => p.alive);
  const ending = state.ending;
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const sentences = (ending?.narrative ?? '').split('. ').filter(Boolean);

  useEffect(() => {
    lineRefs.current.forEach((el, i) => {
      if (el) anim.endingType(el).delay(i * 0.25);
    });
  }, []);

  const percent = ending?.survivalPercent ?? 0;
  const percentColor = percent === 0 ? theme.colors.danger : percent < 50 ? theme.colors.gold : theme.colors.neon;

  return (
    <Screen>
      <h1 style={{ fontFamily: theme.font.display, fontSize: 28, margin: 0 }}>Финал</h1>

      <div style={{ fontSize: 13, color: theme.colors.dim }}>
        В бункер прошли: {survivors.map((s) => s.name).join(', ') || '— никто'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sentences.map((s, i) => (
          <p
            key={i}
            ref={(el) => (lineRefs.current[i] = el)}
            style={{ margin: 0, fontSize: 16, lineHeight: 1.5, fontFamily: theme.font.body }}
          >
            {s.endsWith('.') ? s : s + '.'}
          </p>
        ))}
      </div>

      <div
        style={{
          marginTop: 8,
          padding: 18,
          borderRadius: theme.radius.lg,
          border: `1px solid ${theme.colors.line}`,
          background: theme.colors.panel,
          textAlign: 'center',
        }}
      >
        <div style={{ color: theme.colors.dim, fontSize: 13, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          Человечество
        </div>
        <div style={{ fontFamily: theme.font.display, fontSize: 56, fontWeight: 700, color: percentColor }}>
          {percent}%
        </div>
        <div style={{ color: theme.colors.dim, fontSize: 13 }}>
          {percent === 0 ? 'вымерло' : percent < 50 ? 'едва держится' : 'восстановилось'}
        </div>
      </div>

      {isHost && <Button onClick={onRestart}>Сыграть заново</Button>}
    </Screen>
  );
}
