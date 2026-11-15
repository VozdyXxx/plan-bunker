import { useState } from 'react';
import type { AbilityCard, Player, AbilityMechanic } from '../game/types';
import { theme } from './theme';

const NEEDS_TARGET: AbilityMechanic[] = ['steal_ability', 'swap_card', 'peek', 'force_reveal', 'protect', 'swap_players_votes'];
const KIND_LABEL: Record<AbilityCard['kind'], string> = {
  active: 'Активная',
  on_eliminated: 'При вылете',
  on_survived: 'При проходе',
};

interface Props {
  me: Player;
  players: Player[];
  onPlay: (cardId: string, targetId?: string) => void;
}

/** Панель карт навыков игрока: активные можно сыграть (с выбором цели), триггерные — информативны. */
export function AbilityBar({ me, players, onPlay }: Props) {
  const [picking, setPicking] = useState<string | null>(null);
  const cards = me.abilities ?? [];
  if (cards.length === 0) return null;
  const targets = players.filter((p) => p.alive && p.id !== me.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: theme.colors.dim }}>
        Ваши навыки
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
        {cards.map((c) => {
          const active = c.kind === 'active';
          const needsTarget = NEEDS_TARGET.includes(c.mechanic);
          const disabled = c.used || !active;
          return (
            <div
              key={c.id}
              style={{
                border: `1px solid ${c.used ? theme.colors.line : active ? 'rgba(88,224,166,0.4)' : theme.colors.line}`,
                borderRadius: theme.radius.md,
                padding: 10,
                background: theme.colors.panel,
                opacity: c.used ? 0.5 : 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                <b style={{ fontFamily: theme.font.display, fontSize: 14 }}>{c.title}</b>
                <span style={{ fontSize: 10, color: active ? theme.colors.neon : theme.colors.gold }}>{KIND_LABEL[c.kind]}</span>
              </div>
              <div style={{ fontSize: 12, color: theme.colors.text, lineHeight: 1.35 }}>{c.text}</div>

              {c.used && <div style={{ fontSize: 11, color: theme.colors.dim }}>Использовано</div>}

              {!disabled && !needsTarget && (
                <button type="button" onClick={() => onPlay(c.id)} style={btn()}>
                  Сыграть
                </button>
              )}

              {!disabled && needsTarget && picking !== c.id && (
                <button type="button" onClick={() => setPicking(c.id)} style={btn()}>
                  Выбрать цель
                </button>
              )}

              {!disabled && needsTarget && picking === c.id && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {targets.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        onPlay(c.id, t.id);
                        setPicking(null);
                      }}
                      style={btn('ghost')}
                    >
                      {t.name}
                    </button>
                  ))}
                  <button type="button" onClick={() => setPicking(null)} style={{ ...btn('ghost'), color: theme.colors.dim }}>
                    Отмена
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function btn(variant: 'primary' | 'ghost' = 'primary') {
  return {
    appearance: 'none' as const,
    minHeight: 36,
    padding: '0 12px',
    borderRadius: theme.radius.sm,
    border: variant === 'ghost' ? `1px solid ${theme.colors.line}` : 'none',
    background: variant === 'ghost' ? 'transparent' : theme.colors.neon,
    color: variant === 'ghost' ? theme.colors.text : '#07140d',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  };
}
