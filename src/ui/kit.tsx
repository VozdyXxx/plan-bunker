import type { ReactNode, CSSProperties } from 'react';
import { theme } from './theme';

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: CSSProperties;
}) {
  const bg =
    variant === 'primary' ? theme.colors.gold : variant === 'danger' ? theme.colors.danger : 'transparent';
  const color = variant === 'ghost' ? theme.colors.text : '#0b0e0f';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        appearance: 'none',
        minHeight: 48,
        padding: '0 20px',
        borderRadius: theme.radius.md,
        border: variant === 'ghost' ? `1px solid ${theme.colors.line}` : 'none',
        background: disabled ? 'rgba(255,255,255,0.08)' : bg,
        color: disabled ? theme.colors.dim : color,
        fontFamily: theme.font.display,
        fontSize: 16,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'transform .15s, filter .2s',
        ...style,
      }}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = 'scale(0.97)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {children}
    </button>
  );
}

export function Screen({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100%',
        maxWidth: 820,
        margin: '0 auto',
        padding: '20px 16px calc(28px + env(safe-area-inset-bottom))',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {children}
    </div>
  );
}

export function ScenarioBanner({
  title,
  years,
  spots,
  alive,
  conditions,
  round,
}: {
  title: string;
  years: number;
  spots: number;
  alive: number;
  conditions: string[];
  round: number;
}) {
  return (
    <div
      style={{
        border: `1px solid ${theme.colors.line}`,
        borderLeft: `3px solid ${theme.colors.emergency}`,
        borderRadius: theme.radius.md,
        padding: 14,
        background: theme.colors.panel,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <strong style={{ fontFamily: theme.font.display, fontSize: 18 }}>{title}</strong>
        <span style={{ color: theme.colors.dim, fontSize: 13 }}>Раунд {round}</span>
      </div>
      <div style={{ color: theme.colors.dim, fontSize: 13, marginTop: 6 }}>
        {conditions.join(' · ')}
      </div>
      <div style={{ marginTop: 8, fontSize: 13 }}>
        В бункере <b style={{ color: theme.colors.neon }}>{spots}</b> мест · живых{' '}
        <b style={{ color: theme.colors.gold }}>{alive}</b> · сидеть {years} лет
      </div>
    </div>
  );
}
