import type { EndingStory, Catastrophe, BunkerPlace } from '../types';
import type { EndingFacts } from './factors';

/** Карточка игрока для генерации истории. */
export interface PlayerCard {
  name: string;
  traits: string[];
  hidden: string[];
  abilities: string[];
}

export interface EndingInput {
  catastrophe: Catastrophe;
  place: BunkerPlace;
  survivors: PlayerCard[];
  exiled: PlayerCard[];
  facts: EndingFacts;
}

function standout(p: PlayerCard): string {
  return p.traits.slice(0, 2).join('; ') || 'обычный человек без особых примет';
}

/** Детерминированная история-фоллбэк из фактов (без ИИ). Все секции заполнены. */
export function fallbackStory(input: EndingInput): EndingStory {
  const { catastrophe, place, survivors, exiled, facts } = input;

  const chronicleParts: string[] = [];
  chronicleParts.push(`${catastrophe.title}. Убежище — ${place.title}.`);
  chronicleParts.push(facts.demography + '.');
  chronicleParts.push(`С едой: ${facts.food}; с водой: ${facts.water}.`);
  if (facts.contagion) chronicleParts.push('Бункер столкнулся с заражением.');
  if (facts.rats) chronicleParts.push('Крысы подъедали запасы.');
  if (facts.drugs) chronicleParts.push('Пронесённые наркотики стоили кому-то жизни.');
  chronicleParts.push(
    facts.survivalPercentBunker >= 50
      ? 'В итоге бункер выстоял, пусть и не без потерь.'
      : 'Бункер держался из последних сил.',
  );
  const chronicle = chronicleParts.join(' ');

  return {
    groups: {
      bunker: { survivalPercent: facts.survivalPercentBunker, pros: facts.prosBunker, cons: facts.consBunker },
      exiled: { survivalPercent: facts.survivalPercentExiled, pros: facts.prosExiled, cons: facts.consExiled },
    },
    chronicle,
    survivors: survivors.map((p) => ({
      name: p.name,
      survived: facts.survivalPercentBunker >= 40,
      text: `Держался благодаря тому, что ${standout(p).toLowerCase()}.`,
    })),
    exiled: exiled.map((p) => ({
      name: p.name,
      text: `Оказался за дверью: ${standout(p).toLowerCase()}. Снаружи выжить почти невозможно.`,
    })),
    secrets: [...survivors, ...exiled]
      .filter((p) => p.hidden.length)
      .map((p) => ({ name: p.name, text: `Скрывал: ${p.hidden.join('; ')}.` })),
    tableMistake:
      facts.survivalPercentBunker < 50 && exiled.some((p) => p.traits.some((t) => /врач|повар|инженер|механик/i.test(t)))
        ? 'Стол зря выгнал полезных специалистов — без них бункеру стало только труднее.'
        : 'Серьёзных ошибок в голосовании не было.',
  };
}
