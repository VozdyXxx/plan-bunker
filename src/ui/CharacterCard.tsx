import { useEffect, useRef } from 'react';
import type { Category } from '../game/types';
import { CATEGORY_LABEL, CategoryIcon } from './categories';
import { anim } from './animations';
import { theme } from './theme';
import { cardDisplay } from './cardState';

interface Props {
  category: Category;
  text: string;
  /** Раскрыта публично (видна всем). */
  revealed: boolean;
  /** Своя карта. */
  own?: boolean;
  onReveal?: () => void;
}

/** Одна карта-характеристика: рубашка / приватный текст владельца / публично открытая. */
export function CharacterCard({ category, text, revealed, own = false, onReveal }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const wasRevealed = useRef(revealed);
  const { showText, canReveal, badge } = cardDisplay(revealed, own);

  useEffect(() => {
    if (revealed && !wasRevealed.current && ref.current) anim.reveal(ref.current);
    wasRevealed.current = revealed;
  }, [revealed]);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    anim.tilt(el, x, y);
  };
  const onLeave = () => ref.current && anim.tilt(ref.current, 0, 0);

  const badgeText = badge === 'open' ? '● Открыто' : badge === 'private' ? 'Только вы · раскрыть' : '';
  const badgeColor = badge === 'open' ? theme.colors.neon : theme.colors.gold;

  return (
    <button
      ref={ref}
      type="button"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onClick={canReveal ? onReveal : undefined}
      aria-label={showText ? `${CATEGORY_LABEL[category]}: ${text}` : `${CATEGORY_LABEL[category]}, скрыто`}
      style={{
        appearance: 'none',
        textAlign: 'left',
        cursor: canReveal ? 'pointer' : 'default',
        minHeight: 92,
        padding: 12,
        borderRadius: theme.radius.md,
        border: `1px solid ${revealed ? theme.colors.line : 'rgba(216,178,90,0.25)'}`,
        background: showText
          ? `linear-gradient(160deg, ${theme.colors.panelHi}, ${theme.colors.panel})`
          : `repeating-linear-gradient(45deg, ${theme.colors.panel}, ${theme.colors.panel} 8px, ${theme.colors.bgDeep} 8px, ${theme.colors.bgDeep} 16px)`,
        color: theme.colors.text,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transformStyle: 'preserve-3d',
        boxShadow: revealed ? '0 6px 18px rgba(0,0,0,0.35)' : 'none',
        transition: 'border-color .2s',
        opacity: canReveal ? 0.92 : 1,
      }}
    >
      <span
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          color: revealed ? theme.colors.neon : theme.colors.gold,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <CategoryIcon category={category} size={15} />
          {CATEGORY_LABEL[category]}
        </span>
        {badgeText && <span style={{ fontSize: 10, color: badgeColor }}>{badgeText}</span>}
      </span>
      <span style={{ fontSize: 14, lineHeight: 1.35, fontFamily: theme.font.body }}>
        {showText ? text : '███████'}
      </span>
    </button>
  );
}
