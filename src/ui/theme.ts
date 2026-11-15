// Дизайн-токены «Бункер»: бетон, аварийный свет, холодный неон.
// Собрано по рекомендациям ui-ux-pro-max (тёмная тема, контраст ≥4.5:1,
// карточные токены, плавные переходы 200–250мс, SVG-иконки).
export const theme = {
  colors: {
    bg: '#0b0e0f', // бетонная тьма
    bgDeep: '#070909',
    panel: '#14181a', // стены бункера
    panelHi: '#1b2124',
    line: 'rgba(255,255,255,0.08)',
    text: '#e9e7df',
    dim: '#8c938f',
    neon: '#58e0a6', // холодная индикаторная зелень
    emergency: '#ff5a3c', // аварийная лампа
    gold: '#d8b25a', // латунь/таблички
    danger: '#e0443e',
    ok: '#58e0a6',
  },
  radius: { sm: '8px', md: '14px', lg: '22px' },
  space: (n: number) => `${n * 4}px`,
  dur: { fast: 0.18, base: 0.24, slow: 0.45 },
  font: {
    display: "'Outfit', system-ui, sans-serif",
    body: "'Work Sans', system-ui, sans-serif",
  },
} as const;

/** CSS-переменные для :root (используются в index.css / инлайново). */
export const cssVars: Record<string, string> = {
  '--bg': theme.colors.bg,
  '--bg-deep': theme.colors.bgDeep,
  '--panel': theme.colors.panel,
  '--panel-hi': theme.colors.panelHi,
  '--line': theme.colors.line,
  '--text': theme.colors.text,
  '--dim': theme.colors.dim,
  '--neon': theme.colors.neon,
  '--emergency': theme.colors.emergency,
  '--gold': theme.colors.gold,
  '--danger': theme.colors.danger,
};
