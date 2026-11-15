import { useEffect, useRef } from 'react';
import type { Category } from '../game/types';
import { CATEGORY_LABEL, CategoryIcon } from './categories';
import { anim } from './animations';
import { theme } from './theme';

interface Props {
  category: Category;
  text: string;
  revealed: boolean;
  /** Своя карта — можно раскрыть по клику. */
  own?: boolean;
  onReveal?: () => void;
}

/** Одна карта-характеристика: закрытая «рубашка» или раскрытый текст, с наклоном и анимацией вскрытия. */
export function CharacterCard({ category, text, revealed, own, onReveal }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const wasRevealed = useRef(revealed);

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

  const canReveal = own && !revealed;

  return (
    <button
      ref={ref}
      type="button"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onClick={canReveal ? onReveal : undefined}
      aria-label={revealed ? `${CATEGORY_LABEL[category]}: ${text}` : `${CATEGORY_LABEL[category]}, скрыто`}
      style={{
        appearance: 'none',
        textAlign: 'left',
        cursor: canReveal ? 'pointer' : 'default',
        minHeight: 92,
        padding: 12,
        borderRadius: theme.radius.md,
        border: `1px solid ${revealed ? theme.colors.line : 'rgba(216,178,90,0.25)'}`,
        background: revealed
          ? `linear-gradient(160deg, ${theme.colors.panelHi}, ${theme.colors.panel})`
          : `repeating-linear-gradient(45deg, ${theme.colors.panel}, ${theme.colors.panel} 8px, ${theme.colors.bgDeep} 8px, ${theme.colors.bgDeep} 16px)`,
        color: theme.colors.text,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transformStyle: 'preserve-3d',
        boxShadow: revealed ? '0 6px 18px rgba(0,0,0,0.35)' : 'none',
        transition: 'border-color .2s',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          color: revealed ? theme.colors.neon : theme.colors.gold,
        }}
      >
        <CategoryIcon category={category} size={15} />
        {CATEGORY_LABEL[category]}
      </span>
      <span style={{ fontSize: 14, lineHeight: 1.35, fontFamily: theme.font.body }}>
        {revealed ? text : own ? 'Нажми, чтобы раскрыть' : '███████'}
      </span>
    </button>
  );
}
