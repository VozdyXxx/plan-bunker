export type CardBadge = 'open' | 'private' | 'hidden';

export interface CardDisplay {
  /** Показывать ли текст карты. */
  showText: boolean;
  /** Можно ли раскрыть по клику. */
  canReveal: boolean;
  /** Пометка состояния: открыта всем / видно только владельцу / скрыта. */
  badge: CardBadge;
}

/**
 * Состояние отображения карты:
 * - раскрытая — текст виден всем, пометка «Открыто»;
 * - своя нераскрытая — текст виден только владельцу, можно раскрыть;
 * - чужая нераскрытая — скрыта.
 */
export function cardDisplay(revealed: boolean, own: boolean): CardDisplay {
  return {
    showText: revealed || own,
    canReveal: own && !revealed,
    badge: revealed ? 'open' : own ? 'private' : 'hidden',
  };
}
