import { useState } from 'react';
import type { RoomState, Category } from '../game/types';
import { CATEGORIES } from '../game/types';
import type { AdminAction } from '../game/admin';
import { CATEGORY_LABEL } from './categories';
import { theme } from './theme';

interface Props {
  state: RoomState;
  onAdmin: (action: AdminAction) => void;
}

const inputStyle = {
  minHeight: 36,
  padding: '0 10px',
  borderRadius: theme.radius.sm,
  border: `1px solid ${theme.colors.line}`,
  background: theme.colors.panelHi,
  color: theme.colors.text,
  fontSize: 13,
} as const;
const miniBtn = {
  minHeight: 34,
  padding: '0 12px',
  borderRadius: theme.radius.sm,
  border: 'none',
  background: theme.colors.gold,
  color: '#0b0e0f',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
} as const;

/** Панель полного контроля для хоста (god-mode). */
export function AdminPanel({ state, onAdmin }: Props) {
  const players = state.players;
  const [pid, setPid] = useState(players[0]?.id ?? '');
  const [cat, setCat] = useState<Category>('health');
  const [traitText, setTraitText] = useState('');
  const [bagText, setBagText] = useState('');
  const [condText, setCondText] = useState('');
  const [toId, setToId] = useState(players.find((p) => p.id !== pid)?.id ?? '');

  const sel = players.find((p) => p.id === pid);

  return (
    <details
      style={{
        border: `1px solid rgba(216,178,90,0.4)`,
        borderRadius: theme.radius.md,
        background: 'rgba(216,178,90,0.05)',
        padding: '10px 12px',
      }}
    >
      <summary style={{ cursor: 'pointer', fontFamily: theme.font.display, color: theme.colors.gold, fontSize: 14 }}>
        ⚙ Админ · полный контроль
      </summary>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
        <label style={{ fontSize: 12, color: theme.colors.dim }}>
          Игрок:&nbsp;
          <select value={pid} onChange={(e) => setPid(e.target.value)} style={inputStyle}>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.alive ? '' : '(выбыл)'}
              </option>
            ))}
          </select>
        </label>

        {/* Заменить характеристику */}
        <Row>
          <select value={cat} onChange={(e) => setCat(e.target.value as Category)} style={inputStyle}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
          <input value={traitText} onChange={(e) => setTraitText(e.target.value)} placeholder="новый текст" style={{ ...inputStyle, flex: 1 }} />
          <button
            type="button"
            style={miniBtn}
            onClick={() => traitText && onAdmin({ type: 'replace_trait', playerId: pid, category: cat, text: traitText })}
          >
            Заменить
          </button>
        </Row>

        {/* Багаж */}
        <Row>
          <input value={bagText} onChange={(e) => setBagText(e.target.value)} placeholder="выдать багаж" style={{ ...inputStyle, flex: 1 }} />
          <button type="button" style={miniBtn} onClick={() => bagText && onAdmin({ type: 'set_baggage', playerId: pid, text: bagText })}>
            Выдать
          </button>
        </Row>
        <Row>
          <span style={{ fontSize: 12, color: theme.colors.dim, alignSelf: 'center' }}>Передать багаж →</span>
          <select value={toId} onChange={(e) => setToId(e.target.value)} style={inputStyle}>
            {players.filter((p) => p.id !== pid).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button type="button" style={miniBtn} onClick={() => onAdmin({ type: 'transfer_baggage', fromId: pid, toId })}>
            Передать
          </button>
        </Row>

        {/* Условие / болезнь */}
        <Row>
          <input value={condText} onChange={(e) => setCondText(e.target.value)} placeholder="условие (напр. «Предатель»)" style={{ ...inputStyle, flex: 1 }} />
          <button type="button" style={miniBtn} onClick={() => condText && onAdmin({ type: 'add_condition', playerId: pid, text: condText })}>
            Добавить
          </button>
        </Row>

        {/* Навыки / кик */}
        <Row>
          <button type="button" style={miniBtn} onClick={() => onAdmin({ type: 'grant_ability', playerId: pid })}>
            + навык
          </button>
          {(sel?.abilities ?? []).map((a) => (
            <button
              key={a.id}
              type="button"
              style={{ ...miniBtn, background: theme.colors.panelHi, color: theme.colors.text, border: `1px solid ${theme.colors.line}` }}
              onClick={() => onAdmin({ type: 'revoke_ability', playerId: pid, cardId: a.id })}
            >
              − {a.title}
            </button>
          ))}
          <button type="button" style={{ ...miniBtn, background: theme.colors.danger, color: '#fff' }} onClick={() => onAdmin({ type: 'kick', playerId: pid })}>
            Выгнать
          </button>
        </Row>

        {/* Бункер */}
        {state.bunker && (
          <div style={{ borderTop: `1px solid ${theme.colors.line}`, paddingTop: 8 }}>
            <div style={{ fontSize: 12, color: theme.colors.dim, marginBottom: 6 }}>Бункер</div>
            <Row>
              <Toggle label="Крысы" on={!!state.bunker.rats} onClick={() => onAdmin({ type: 'patch_bunker', patch: { rats: !state.bunker!.rats } })} />
              <Toggle label="Наркотики" on={!!state.bunker.drugs} onClick={() => onAdmin({ type: 'patch_bunker', patch: { drugs: !state.bunker!.drugs } })} />
              <Toggle label="Генератор сломан" on={!!state.bunker.brokenGenerator} onClick={() => onAdmin({ type: 'patch_bunker', patch: { brokenGenerator: !state.bunker!.brokenGenerator } })} />
              <Toggle label="Заражение" on={!!state.bunker.contaminated} onClick={() => onAdmin({ type: 'patch_bunker', patch: { contaminated: !state.bunker!.contaminated } })} />
            </Row>
            <Row>
              <Stepper label="Мест" value={state.bunker.spots} onChange={(v) => onAdmin({ type: 'patch_bunker', patch: { spots: Math.max(1, v) } })} />
              <Stepper label="Срок (лет)" value={state.bunker.years} onChange={(v) => onAdmin({ type: 'patch_bunker', patch: { years: Math.max(1, v) } })} />
              <Stepper label="Еда" value={state.bunker.foodMonths} step={6} onChange={(v) => onAdmin({ type: 'patch_bunker', patch: { foodMonths: Math.max(0, v) } })} />
              <Stepper label="Вода" value={state.bunker.waterMonths} step={6} onChange={(v) => onAdmin({ type: 'patch_bunker', patch: { waterMonths: Math.max(0, v) } })} />
            </Row>
          </div>
        )}
      </div>
    </details>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{children}</div>;
}
function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...miniBtn,
        background: on ? theme.colors.danger : theme.colors.panelHi,
        color: on ? '#fff' : theme.colors.text,
        border: `1px solid ${theme.colors.line}`,
      }}
    >
      {on ? '● ' : '○ '}
      {label}
    </button>
  );
}
function Stepper({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: theme.colors.dim }}>
      {label}:
      <button type="button" style={{ ...miniBtn, padding: '0 8px', background: theme.colors.panelHi, color: theme.colors.text }} onClick={() => onChange(value - step)}>
        −
      </button>
      <b style={{ color: theme.colors.text, minWidth: 24, textAlign: 'center' }}>{value}</b>
      <button type="button" style={{ ...miniBtn, padding: '0 8px', background: theme.colors.panelHi, color: theme.colors.text }} onClick={() => onChange(value + step)}>
        +
      </button>
    </span>
  );
}
