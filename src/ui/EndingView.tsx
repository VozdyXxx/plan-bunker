import type { RoomState, EndingStory } from '../game/types';
import { Button, Screen } from './kit';
import { theme } from './theme';

interface Props {
  state: RoomState;
  isHost: boolean;
  onRestart: () => void;
}

function pct(p: number): string {
  return p === 0 ? theme.colors.danger : p < 50 ? theme.colors.gold : theme.colors.neon;
}

function GroupCard({ title, percent, pros, cons, accent }: { title: string; percent: number; pros: string[]; cons: string[]; accent: string }) {
  return (
    <div style={{ flex: 1, minWidth: 240, border: `1px solid ${theme.colors.line}`, borderTop: `3px solid ${accent}`, borderRadius: theme.radius.md, padding: 14, background: theme.colors.panel }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <b style={{ fontFamily: theme.font.display, fontSize: 16 }}>{title}</b>
        <span style={{ fontFamily: theme.font.display, fontSize: 24, fontWeight: 700, color: pct(percent) }}>{percent}%</span>
      </div>
      <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13, lineHeight: 1.5 }}>
        {pros.map((t, i) => (
          <li key={`p${i}`} style={{ color: theme.colors.neon }}>{t}</li>
        ))}
        {cons.map((t, i) => (
          <li key={`c${i}`} style={{ color: theme.colors.danger }}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ fontFamily: theme.font.display, fontSize: 18, margin: '4px 0 8px' }}>{title}</h2>
      {children}
    </div>
  );
}

function RichEnding({ story }: { story: EndingStory }) {
  return (
    <>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <GroupCard title="В бункере" percent={story.groups.bunker.survivalPercent} pros={story.groups.bunker.pros} cons={story.groups.bunker.cons} accent={theme.colors.neon} />
        <GroupCard title="Изгнанные" percent={story.groups.exiled.survivalPercent} pros={story.groups.exiled.pros} cons={story.groups.exiled.cons} accent={theme.colors.emergency} />
      </div>

      <Section title="Что было дальше">
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, fontFamily: theme.font.body }}>{story.chronicle}</p>
      </Section>

      {story.survivors.length > 0 && (
        <Section title="Те, кто выжил">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {story.survivors.map((s, i) => (
              <div key={i} style={{ borderLeft: `3px solid ${s.survived ? theme.colors.neon : theme.colors.danger}`, paddingLeft: 10 }}>
                <b>{s.name}</b> <span style={{ fontSize: 12, color: s.survived ? theme.colors.neon : theme.colors.danger }}>{s.survived ? 'выжил' : 'погиб'}</span>
                <div style={{ fontSize: 14, color: theme.colors.text, lineHeight: 1.45 }}>{s.text}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {story.exiled.length > 0 && (
        <Section title="Те, кого изгнали">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {story.exiled.map((s, i) => (
              <div key={i} style={{ borderLeft: `3px solid ${theme.colors.dim}`, paddingLeft: 10 }}>
                <b>{s.name}</b>
                <div style={{ fontSize: 14, color: theme.colors.dim, lineHeight: 1.45 }}>{s.text}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {story.secrets.length > 0 && (
        <Section title="Тайны">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {story.secrets.map((s, i) => (
              <div key={i} style={{ fontSize: 14 }}>
                <b style={{ color: theme.colors.gold }}>{s.name}:</b> {s.text}
              </div>
            ))}
          </div>
        </Section>
      )}

      <div style={{ padding: 14, borderRadius: theme.radius.md, border: `1px solid ${theme.colors.line}`, background: 'rgba(216,178,90,0.06)' }}>
        <b style={{ color: theme.colors.gold, fontFamily: theme.font.display }}>Ошибка стола</b>
        <div style={{ fontSize: 14, marginTop: 4, lineHeight: 1.45 }}>{story.tableMistake}</div>
      </div>
    </>
  );
}

export function EndingView({ state, isHost, onRestart }: Props) {
  const survivors = state.players.filter((p) => p.alive);
  const story = state.story;
  const ending = state.ending;

  return (
    <Screen>
      <h1 style={{ fontFamily: theme.font.display, fontSize: 28, margin: 0 }}>Финал</h1>
      <div style={{ fontSize: 13, color: theme.colors.dim }}>
        В бункер прошли: {survivors.map((s) => s.name).join(', ') || '— никто'}
      </div>

      {story ? (
        <RichEnding story={story} />
      ) : ending ? (
        <>
          <p style={{ fontSize: 16, lineHeight: 1.6, fontFamily: theme.font.body }}>{ending.narrative}</p>
          <div style={{ fontSize: 13, color: theme.colors.dim }}>ИИ дописывает историю…</div>
        </>
      ) : (
        <div style={{ fontSize: 14, color: theme.colors.dim }}>ИИ пишет историю концовки…</div>
      )}

      {isHost && <Button onClick={onRestart}>Сыграть заново</Button>}
    </Screen>
  );
}
