import type { BunkerState, Catastrophe, BunkerPlace } from '../game/types';
import { theme } from './theme';

interface Props {
  catastrophe?: Catastrophe;
  place?: BunkerPlace;
  bunker?: BunkerState;
}

function Block({ label, title, text, accent }: { label: string; title: string; text: string; accent: string }) {
  return (
    <div style={{ borderLeft: `3px solid ${accent}`, paddingLeft: 12 }}>
      <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: theme.colors.dim }}>{label}</div>
      <div style={{ fontFamily: theme.font.display, fontSize: 16, margin: '2px 0 4px' }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.4, color: theme.colors.text }}>{text}</div>
    </div>
  );
}

/** Панель с описанием катастрофы, бункера и его состоянием (комнаты, запасы). */
export function BunkerPanel({ catastrophe, place, bunker }: Props) {
  if (!catastrophe && !place && !bunker) return null;
  return (
    <div
      style={{
        border: `1px solid ${theme.colors.line}`,
        borderRadius: theme.radius.md,
        padding: 14,
        background: theme.colors.panel,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {catastrophe && <Block label="Катастрофа" title={catastrophe.title} text={catastrophe.text} accent={theme.colors.emergency} />}
      {place && <Block label="Бункер" title={place.title} text={place.text} accent={theme.colors.neon} />}

      {bunker && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12 }}>
            <Stat label="Срок" value={`${bunker.years} лет`} />
            <Stat label="Мест" value={String(bunker.spots)} color={theme.colors.neon} />
            <Stat label="Еда" value={`${bunker.foodMonths + bunker.extraFood} чел·мес`} />
            <Stat label="Вода" value={`${bunker.waterMonths} чел·мес`} />
            {bunker.rats && <Flag text="Крысы" />}
            {bunker.drugs && <Flag text="Наркотики" />}
            {bunker.brokenGenerator && <Flag text="Генератор сломан" />}
            {bunker.contaminated && <Flag text="Заражение" />}
          </div>

          {bunker.rooms.length > 0 && (
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: theme.colors.dim, marginBottom: 6 }}>
                Комнаты
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {bunker.rooms.map((r) => (
                  <span
                    key={r.id}
                    title={r.locked ? 'Заблокирована' : 'Доступна'}
                    style={{
                      fontSize: 12,
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: `1px solid ${r.locked ? 'rgba(224,68,62,0.4)' : theme.colors.line}`,
                      background: r.locked ? 'rgba(224,68,62,0.08)' : theme.colors.panelHi,
                      color: r.locked ? theme.colors.danger : theme.colors.text,
                    }}
                  >
                    {r.locked ? '🔒 ' : ''}
                    {r.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {bunker.findings.length > 0 && (
            <div style={{ fontSize: 12, color: theme.colors.dim }}>
              Находки: <span style={{ color: theme.colors.text }}>{bunker.findings.join(' · ')}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <span style={{ padding: '4px 10px', borderRadius: 8, background: theme.colors.panelHi, color: theme.colors.text }}>
      {label}: <b style={{ color: color ?? theme.colors.gold }}>{value}</b>
    </span>
  );
}
function Flag({ text }: { text: string }) {
  return (
    <span style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(224,68,62,0.12)', color: theme.colors.danger }}>
      ⚠ {text}
    </span>
  );
}
