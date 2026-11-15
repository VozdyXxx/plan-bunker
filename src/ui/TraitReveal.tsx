import type { Category, Character, Player } from '../game/types';
import { CATEGORIES } from '../game/types';
import { CharacterCard } from './CharacterCard';

interface Props {
  character: Character;
  player: Player;
  own?: boolean;
  onReveal?: (category: Category) => void;
}

/** Сетка из девяти карт одного персонажа: свои видны полностью, чужие — только раскрытые. */
export function TraitReveal({ character, player, own, onReveal }: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 10,
      }}
    >
      {CATEGORIES.map((cat) => {
        const revealed = player.revealed.includes(cat);
        return (
          <CharacterCard
            key={cat}
            category={cat}
            text={character.traits[cat]?.text ?? ''}
            revealed={revealed}
            own={own}
            onReveal={onReveal ? () => onReveal(cat) : undefined}
          />
        );
      })}
    </div>
  );
}
