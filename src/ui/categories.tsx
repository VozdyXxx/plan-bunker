import type { Category } from '../game/types';

export const CATEGORY_LABEL: Record<Category, string> = {
  profession: 'Профессия',
  biology: 'Биология',
  health: 'Здоровье',
  hobby: 'Хобби',
  baggage: 'Багаж',
  fact: 'Факт',
  phobia: 'Фобия',
  trait: 'Характер',
  special: 'Способность',
};

// Простые line-иконки (без эмодзи, по правилу дизайна). 24×24, stroke.
const PATHS: Record<Category, string> = {
  profession: 'M3 8h18v11H3zM8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  biology: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20a7 7 0 0 1 14 0',
  health: 'M12 20s-7-4.5-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.5-7 9-7 9z',
  hobby: 'M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z',
  baggage: 'M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7',
  fact: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8h.01M11 12h1v4h1',
  phobia: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  trait: 'M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  special: 'M13 2L3 14h7l-1 8 10-12h-7l1-8z',
};

export function CategoryIcon({ category, size = 18 }: { category: Category; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[category]} />
    </svg>
  );
}
