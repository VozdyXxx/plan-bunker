import type { EndingStory } from '../src/game/types';
import { fallbackStory, type EndingInput } from '../src/game/endings/fallback';

export type { EndingInput };

export interface RenderOpts {
  apiKey?: string;
  model?: string;
  fetchImpl?: typeof fetch;
}

/** Собирает промпт для модели: все данные партии + требование вернуть строгий JSON. */
export function buildPrompt(input: EndingInput): string {
  const { catastrophe, place, survivors, exiled, facts } = input;
  const card = (p: { name: string; traits: string[]; hidden: string[]; abilities: string[] }) =>
    `  - ${p.name}: ${[...p.traits, ...p.hidden].join('; ') || 'нет данных'}${
      p.abilities.length ? ` [навыки: ${p.abilities.join(', ')}]` : ''
    }`;

  return [
    'Ты — рассказчик игры «Бункер». Напиши драматичную, связную историю концовки на русском.',
    'Опирайся на реальные карты персонажей, их конфликты и факты ниже. Не выдумывай фактов, которых нет.',
    '',
    `КАТАСТРОФА: ${catastrophe.title} — ${catastrophe.text}`,
    `БУНКЕР: ${place.title} — ${place.text}`,
    '',
    `ФАКТЫ: демография — ${facts.demography}; еда — ${facts.food}; вода — ${facts.water};` +
      ` крысы — ${facts.rats ? 'да' : 'нет'}; наркотики — ${facts.drugs ? 'да' : 'нет'};` +
      ` заражение — ${facts.contagion ? 'да' : 'нет'}; рабочих рук — ${facts.hands}.`,
    `ШАНС ВЫЖИТЬ: бункер ${facts.survivalPercentBunker}%, изгнанные ${facts.survivalPercentExiled}%.`,
    `ПЛЮСЫ БУНКЕРА: ${facts.prosBunker.join('; ') || '—'}`,
    `МИНУСЫ БУНКЕРА: ${facts.consBunker.join('; ') || '—'}`,
    '',
    'ПРОШЛИ В БУНКЕР:',
    survivors.map(card).join('\n') || '  —',
    'ИЗГНАНЫ:',
    exiled.map(card).join('\n') || '  —',
    '',
    'Верни СТРОГО валидный JSON без пояснений по схеме:',
    '{',
    '  "groups": { "bunker": {"survivalPercent": number, "pros": string[], "cons": string[]},',
    '              "exiled": {"survivalPercent": number, "pros": string[], "cons": string[]} },',
    '  "chronicle": string,  // проза «что было дальше», 4-8 предложений',
    '  "survivors": [{"name": string, "survived": boolean, "text": string}],',
    '  "exiled": [{"name": string, "text": string}],',
    '  "secrets": [{"name": string, "text": string}],',
    '  "tableMistake": string',
    '}',
    `Используй проценты: бункер ${facts.survivalPercentBunker}, изгнанные ${facts.survivalPercentExiled}.`,
  ].join('\n');
}

function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((v) => typeof v === 'string');
}
export function isEndingStory(x: unknown): x is EndingStory {
  if (typeof x !== 'object' || x === null) return false;
  const s = x as Record<string, unknown>;
  const g = s.groups as Record<string, unknown> | undefined;
  const grp = (v: unknown) => {
    const o = v as Record<string, unknown> | undefined;
    return !!o && typeof o.survivalPercent === 'number' && isStringArray(o.pros) && isStringArray(o.cons);
  };
  return (
    !!g &&
    grp(g.bunker) &&
    grp(g.exiled) &&
    typeof s.chronicle === 'string' &&
    Array.isArray(s.survivors) &&
    Array.isArray(s.exiled) &&
    Array.isArray(s.secrets) &&
    typeof s.tableMistake === 'string'
  );
}

/** Генерирует историю концовки через Gemini; при любой проблеме — детерминированный фоллбэк. */
export async function renderEnding(input: EndingInput, opts: RenderOpts = {}): Promise<EndingStory> {
  const apiKey = opts.apiKey ?? process.env.GEMINI_API_KEY;
  if (!apiKey) return fallbackStory(input);
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  const model = opts.model ?? 'gemini-2.0-flash';
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(input) }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 1 },
      }),
    });
    if (!res.ok) return fallbackStory(input);
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') return fallbackStory(input);
    const parsed = JSON.parse(text);
    return isEndingStory(parsed) ? parsed : fallbackStory(input);
  } catch {
    return fallbackStory(input);
  }
}
