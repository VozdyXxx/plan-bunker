import type { Character, Scenario, BunkerState, Catastrophe } from '../types';

export interface FactorResult {
  outcomes: string[];
  /** Вычет из процента выживания человечества. */
  penalty: number;
  /** Жёсткий финал: человечество не продолжится. */
  extinct?: boolean;
}

/** Есть ли у персонажа тег в любой из его карт. */
function hasTag(ch: Character, tag: string): boolean {
  return Object.values(ch.traits).some((t) => t.tags.includes(tag));
}
function anyHasTag(survivors: Character[], tag: string): boolean {
  return survivors.some((ch) => hasTag(ch, tag));
}
function countTag(survivors: Character[], tag: string): number {
  return survivors.filter((ch) => hasTag(ch, tag)).length;
}

const DISEASE_TAGS = ['disease'];

/** Демография: без пары мужчина+женщина продолжения рода нет. */
export function demography(survivors: Character[]): FactorResult {
  const males = countTag(survivors, 'male');
  const females = countTag(survivors, 'female');
  if (males >= 1 && females >= 1 && survivors.length >= 2) {
    return { outcomes: ['reproduction:possible'], penalty: 0 };
  }
  return { outcomes: ['extinction:no-reproduction'], penalty: 100, extinct: true };
}

/** Маньяк среди выживших — жертвы. */
export function maniac(survivors: Character[]): FactorResult {
  if (anyHasTag(survivors, 'maniac')) return { outcomes: ['deaths:maniac'], penalty: 40 };
  return { outcomes: [], penalty: 0 };
}

/** Болезнь: без врача/иммунитета — эпидемия. */
export function disease(survivors: Character[], scenario: Scenario): FactorResult {
  const dangerous = scenario.tags.some((t) => DISEASE_TAGS.includes(t));
  if (!dangerous) return { outcomes: [], penalty: 0 };
  const protectedGroup = anyHasTag(survivors, 'doctor') || anyHasTag(survivors, 'immune');
  if (protectedGroup) return { outcomes: ['disease:contained'], penalty: 0 };
  return { outcomes: ['epidemic'], penalty: 50 };
}

/** Еда: без запасов или повара — голод. */
export function food(survivors: Character[]): FactorResult {
  if (anyHasTag(survivors, 'food') || anyHasTag(survivors, 'cook')) {
    return { outcomes: ['food:ok'], penalty: 0 };
  }
  return { outcomes: ['food:shortage'], penalty: 20 };
}

/** Психика: большой бункер без лидера — срывы и дрязги. */
export function psyche(survivors: Character[]): FactorResult {
  const hasLeader = anyHasTag(survivors, 'leader');
  if (survivors.length >= 4 && !hasLeader) {
    return { outcomes: ['psyche:tension'], penalty: 10 };
  }
  return { outcomes: [], penalty: 0 };
}

export const ALL_FACTORS = { demography, maniac, disease, food, psyche };

// ===================== v2: computeFactors =====================

export interface EndingFacts {
  survivalPercentBunker: number;
  survivalPercentExiled: number;
  prosBunker: string[];
  consBunker: string[];
  prosExiled: string[];
  consExiled: string[];
  demography: string;
  contagion: boolean;
  food: string;
  water: string;
  rats: boolean;
  drugs: boolean;
  rooms: { unlocked: string[]; locked: string[] };
  hands: number;
}

function ageOf(ch: Character): number | null {
  for (const t of Object.values(ch.traits)) {
    const tag = t.tags.find((x) => x.startsWith('age:'));
    if (tag) return Number(tag.slice(4));
  }
  return null;
}
function fertile(ch: Character): boolean {
  const age = ageOf(ch);
  const okAge = age === null || (age >= 18 && age <= 45);
  return okAge && !hasTag(ch, 'infertile');
}
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Полный разбор финала: проценты по группам, плюсы/минусы и факты для ИИ-истории. */
export function computeFactors(
  survivors: Character[],
  exiled: Character[],
  bunker: BunkerState,
  _scenario: Catastrophe,
): EndingFacts {
  const prosBunker: string[] = [];
  const consBunker: string[] = [];
  let p = 85;

  const hasDoctor = anyHasTag(survivors, 'doctor');
  const medbayOpen = bunker.rooms.some((r) => r.id === 'medbay' && !r.locked) || hasDoctor;
  const contagion = anyHasTag(survivors, 'contagious') || !!bunker.contaminated;
  const needsMeds = anyHasTag(survivors, 'needs-meds');

  // Болезни / заражение
  if (contagion) {
    if (medbayOpen) {
      consBunker.push('В бункере есть заражённый, но врач держит вспышку под контролем');
      p -= 12;
    } else {
      consBunker.push('В бункере заражение, а врача и медотсека нет — эпидемия');
      p -= 35;
    }
  }
  if (needsMeds && !medbayOpen) {
    consBunker.push('Есть хронические больные, но нет лекарств и врача');
    p -= 12;
  }
  if (hasDoctor) prosBunker.push('Среди выживших есть врач');

  // Еда
  const foodHave = bunker.foodMonths + bunker.extraFood;
  const foodNeed = Math.max(1, survivors.length) * bunker.years * 12;
  const foodOk = foodHave >= foodNeed || anyHasTag(survivors, 'food') || anyHasTag(survivors, 'cook');
  const foodStr = foodOk ? 'запасов и добытчиков достаточно' : 'еды на всех не хватит';
  if (foodOk) {
    if (anyHasTag(survivors, 'cook')) prosBunker.push('Повар растянет припасы');
    if (anyHasTag(survivors, 'food')) prosBunker.push('С собой принесли запас еды');
    if (foodHave >= foodNeed) prosBunker.push('Запасов еды в бункере хватает на весь срок');
  } else {
    consBunker.push('Еды на весь срок не хватает');
    p -= 22;
  }

  // Вода
  const waterNeed = Math.max(1, survivors.length) * bunker.years * 12;
  const waterOk = bunker.waterMonths >= waterNeed || anyHasTag(survivors, 'fixer');
  const waterStr = waterOk ? 'вода есть или её добудут' : 'воды надолго не хватит';
  if (!waterOk) {
    consBunker.push('Пресной воды на всех надолго не хватит');
    p -= 18;
  } else if (bunker.waterMonths >= waterNeed) {
    prosBunker.push('Запас воды покрывает весь срок');
  }

  // Крысы, наркотики, генератор
  if (bunker.rats) {
    consBunker.push('Крысы в бункере портят запасы');
    p -= 10;
  }
  if (bunker.drugs) {
    consBunker.push('Пронесённые наркотики привели к передозировкам');
    p -= 15;
  }
  if (bunker.brokenGenerator) {
    consBunker.push('Генератор сломан — холод и тьма');
    p -= 10;
  }

  // Маньяк
  if (anyHasTag(survivors, 'maniac')) {
    consBunker.push('Среди выживших есть склонный к насилию — будут жертвы');
    p -= 20;
  }

  // Рабочие руки и лидер
  const disabled = countTag(survivors, 'disabled');
  const hands = Math.max(0, survivors.length - disabled);
  if (survivors.length >= 4 && !anyHasTag(survivors, 'leader')) {
    consBunker.push('Нет лидера — большой группе грозят раздоры');
    p -= 8;
  } else if (anyHasTag(survivors, 'leader')) {
    prosBunker.push('Есть лидер, который держит группу вместе');
  }
  if (hands < Math.ceil(survivors.length / 2)) {
    consBunker.push('Слишком мало рабочих рук на весь быт');
    p -= 8;
  }
  if (anyHasTag(survivors, 'fixer')) prosBunker.push('Есть мастер, способный чинить и строить');

  // Демография
  const maleF = survivors.filter((c) => hasTag(c, 'male') && fertile(c)).length;
  const femaleF = survivors.filter((c) => hasTag(c, 'female') && fertile(c)).length;
  const pregnant = anyHasTag(survivors, 'pregnant');
  let demographyStr: string;
  if (pregnant || (maleF >= 1 && femaleF >= 1)) {
    demographyStr = 'Продолжение рода возможно';
    prosBunker.push('Есть шанс на потомство и будущее');
  } else {
    demographyStr = 'Продолжение рода невозможно — род обречён';
    consBunker.push('Нет пары детородного возраста — человечество не продолжится');
    p -= 15;
  }

  // Комнаты
  const unlocked = bunker.rooms.filter((r) => !r.locked).map((r) => r.name);
  const locked = bunker.rooms.filter((r) => r.locked).map((r) => r.name);

  // ----- Изгнанные -----
  const prosExiled: string[] = [];
  const consExiled: string[] = [];
  let pe = 20;
  if (anyHasTag(exiled, 'food')) {
    prosExiled.push('У изгнанных есть запас еды');
    pe += 8;
  }
  if (anyHasTag(exiled, 'weapon')) {
    prosExiled.push('У изгнанных есть оружие для защиты и охоты');
    pe += 8;
  }
  if (anyHasTag(exiled, 'immune')) {
    prosExiled.push('Кто-то из изгнанных стоек к болезням');
    pe += 6;
  }
  if (anyHasTag(exiled, 'fixer')) {
    prosExiled.push('Среди изгнанных есть мастер выживания');
    pe += 6;
  }
  consExiled.push('Снаружи смертельно опасно без укрытия');
  if (exiled.some((c) => (ageOf(c) ?? 0) >= 60)) {
    consExiled.push('Среди изгнанных пожилые — им не выжить в суровых условиях');
    pe -= 8;
  }
  if (anyHasTag(exiled, 'needs-meds')) {
    consExiled.push('Больным снаружи нечем лечиться');
    pe -= 8;
  }

  return {
    survivalPercentBunker: clamp(p),
    survivalPercentExiled: clamp(pe),
    prosBunker,
    consBunker,
    prosExiled,
    consExiled,
    demography: demographyStr,
    contagion,
    food: foodStr,
    water: waterStr,
    rats: bunker.rats,
    drugs: bunker.drugs,
    rooms: { unlocked, locked },
    hands,
  };
}
