import { CATEGORIES, type Category, type Character, type Trait } from './types';
import { loadContent } from './content';

/** Берём n различных элементов из пула (частичный Фишер-Йейтс). */
function sampleDistinct<T>(pool: T[], n: number, rng: () => number): T[] {
  const a = pool.slice();
  const out: T[] = [];
  for (let i = 0; i < n && a.length > 0; i++) {
    const j = Math.floor(rng() * a.length);
    out.push(a[j]);
    a.splice(j, 1);
  }
  return out;
}

/** Раздаёт каждому игроку по одной карте из каждой категории; внутри категории карты не повторяются. */
export function dealCharacters(playerIds: string[], rng: () => number): Character[] {
  const content = loadContent();
  const picks = {} as Record<Category, Trait[]>;
  for (const cat of CATEGORIES) {
    picks[cat] = sampleDistinct(content[cat], playerIds.length, rng);
  }
  return playerIds.map((playerId, i) => {
    const traits = {} as Record<Category, Trait>;
    for (const cat of CATEGORIES) traits[cat] = picks[cat][i];
    return { playerId, traits };
  });
}
