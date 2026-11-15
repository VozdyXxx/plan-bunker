import templates from './templates.json';

export interface NarrativeContext {
  count: number;
  years: number;
  title: string;
  percent: number;
}

type Templates = Record<string, string[]>;

function fill(line: string, ctx: NarrativeContext): string {
  return line
    .replaceAll('{count}', String(ctx.count))
    .replaceAll('{years}', String(ctx.years))
    .replaceAll('{title}', ctx.title)
    .replaceAll('{percent}', String(ctx.percent));
}

/** Собирает текст концовки из intro, строк по каждому исходу и эпилога. */
export function compose(outcomes: string[], ctx: NarrativeContext, rng: () => number): string {
  const t = templates as Templates;
  const pick = (arr: string[]) => arr[Math.floor(rng() * arr.length) % arr.length];
  const lines: string[] = [];
  lines.push(fill(pick(t.intro), ctx));
  for (const o of outcomes) {
    const variants = t[o];
    if (variants && variants.length) lines.push(fill(pick(variants), ctx));
  }
  lines.push(fill(pick(t.epilogue), ctx));
  return lines.join(' ');
}
