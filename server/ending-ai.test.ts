import { describe, it, expect } from 'vitest';
import { renderEnding, buildPrompt } from './ending-ai';
import { fallbackStory, type EndingInput } from '../src/game/endings/fallback';
import type { EndingStory } from '../src/game/types';

const input: EndingInput = {
  catastrophe: { id: 'c', title: 'Пандемия', text: 'Вирус выкосил города.' },
  place: { id: 'p', title: 'Метро «Глубокая»', text: 'Станция на 80 м под землёй.' },
  survivors: [
    { name: 'Аня', traits: ['Врач высшей категории'], hidden: [], abilities: ['Кража'] },
    { name: 'Боря', traits: ['Повар'], hidden: ['ВИЧ'], abilities: [] },
  ],
  exiled: [{ name: 'Витя', traits: ['Блогер без опыта'], hidden: [], abilities: [] }],
  facts: {
    survivalPercentBunker: 62,
    survivalPercentExiled: 14,
    prosBunker: ['Среди выживших есть врач'],
    consBunker: ['Еды на весь срок не хватает'],
    prosExiled: [],
    consExiled: ['Снаружи смертельно опасно без укрытия'],
    demography: 'Продолжение рода возможно',
    contagion: true,
    food: 'еды на всех не хватит',
    water: 'вода есть или её добудут',
    rats: false,
    drugs: false,
    rooms: { unlocked: ['Склад'], locked: ['Оружейная'] },
    hands: 2,
  },
};

const validStory: EndingStory = {
  groups: {
    bunker: { survivalPercent: 62, pros: ['врач'], cons: ['голод'] },
    exiled: { survivalPercent: 14, pros: [], cons: ['холод'] },
  },
  chronicle: 'ИИ-история из мока.',
  survivors: [{ name: 'Аня', survived: true, text: 'Выжила.' }],
  exiled: [{ name: 'Витя', text: 'Погиб.' }],
  secrets: [{ name: 'Боря', text: 'Скрывал ВИЧ.' }],
  tableMistake: 'Ошибок не было.',
};

function fakeFetch(body: unknown, ok = true): typeof fetch {
  return (async () => ({ ok, json: async () => body })) as unknown as typeof fetch;
}

describe('buildPrompt', () => {
  it('включает имена, карты и проценты', () => {
    const p = buildPrompt(input);
    expect(p).toContain('Аня');
    expect(p).toContain('Врач высшей категории');
    expect(p).toContain('62');
    expect(p).toContain('Пандемия');
  });
});

describe('renderEnding', () => {
  it('без ключа возвращает детерминированный фоллбэк', async () => {
    const out = await renderEnding(input, { apiKey: undefined });
    expect(out).toEqual(fallbackStory(input));
    expect(out.groups.bunker.survivalPercent).toBe(62);
    expect(out.survivors.length).toBe(2);
  });

  it('парсит валидный JSON от модели', async () => {
    const body = { candidates: [{ content: { parts: [{ text: JSON.stringify(validStory) }] } }] };
    const out = await renderEnding(input, { apiKey: 'k', fetchImpl: fakeFetch(body) });
    expect(out.chronicle).toBe('ИИ-история из мока.');
  });

  it('при битом тексте падает в фоллбэк', async () => {
    const body = { candidates: [{ content: { parts: [{ text: 'это не json' }] } }] };
    const out = await renderEnding(input, { apiKey: 'k', fetchImpl: fakeFetch(body) });
    expect(out).toEqual(fallbackStory(input));
  });

  it('при JSON не той схемы падает в фоллбэк', async () => {
    const body = { candidates: [{ content: { parts: [{ text: JSON.stringify({ foo: 1 }) }] } }] };
    const out = await renderEnding(input, { apiKey: 'k', fetchImpl: fakeFetch(body) });
    expect(out).toEqual(fallbackStory(input));
  });

  it('при ошибке сети падает в фоллбэк', async () => {
    const throwing = (async () => {
      throw new Error('network');
    }) as unknown as typeof fetch;
    const out = await renderEnding(input, { apiKey: 'k', fetchImpl: throwing });
    expect(out).toEqual(fallbackStory(input));
  });
});
