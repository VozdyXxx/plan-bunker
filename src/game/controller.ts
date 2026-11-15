import { CATEGORIES, type Category, type RoomState, type Scenario } from './types';
import { dealCharacters } from './deal';
import { pickScenario, buildScenario } from './scenario';
import { dealAbilities, applyOnEliminated, applyOnSurvived } from './abilities';
import { nextPhase } from './flow';
import { tallyVotes } from './vote';
import { generateEnding } from './endings';

/** Хост стартует игру: раздаёт персонажей и навыки, собирает катастрофу+бункер, открывает раунд. */
export function startGame(state: RoomState, rng: () => number): RoomState {
  const ids = state.players.map((p) => p.id);
  const characters = dealCharacters(ids, rng);
  const { catastrophe, place, bunker } = buildScenario(ids.length, rng);
  // Производим Scenario-совместимый объект (для баннера и старой концовки).
  const scenario: Scenario = {
    id: catastrophe.id,
    title: catastrophe.title,
    years: bunker.years,
    spots: bunker.spots,
    conditions: [place.title],
    tags: [],
  };
  return {
    ...state,
    phase: 'round',
    round: 1,
    spots: bunker.spots,
    scenarioId: catastrophe.id,
    scenario,
    catastrophe,
    place,
    bunker,
    characters,
    turn: 0,
    votes: {},
    players: state.players.map((p) => ({ ...p, alive: true, revealed: [], abilities: dealAbilities(rng), conditions: [] })),
  };
}

/** Игрок раскрывает одну из своих характеристик. */
export function revealTrait(state: RoomState, playerId: string, category: Category): RoomState {
  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId && !p.revealed.includes(category) ? { ...p, revealed: [...p.revealed, category] } : p,
    ),
  };
}

/** Регистрирует голос. */
export function castVote(state: RoomState, voterId: string, targetId: string): RoomState {
  return { ...state, votes: { ...(state.votes ?? {}), [voterId]: targetId } };
}

/** Подводит итог голосования, выгоняет игрока, применяет навыки и двигает фазу. */
export function resolveVote(state: RoomState, rng: () => number = Math.random): RoomState {
  const { eliminated } = tallyVotes(state.votes ?? {}, state.players);
  if (eliminated === null) return state; // никто не проголосовал — остаёмся в голосовании

  // Помечаем изгнанного и применяем его эффекты «при вылете» (могут задеть бункер и других).
  let s: RoomState = { ...state, players: state.players.map((p) => (p.id === eliminated ? { ...p, alive: false } : p)) };
  const elim = s.players.find((p) => p.id === eliminated);
  if (elim) s = applyOnEliminated(s, elim, rng);

  const moved = nextPhase({ ...s, votes: {} });

  // Если дошли до финала — применяем эффекты «при проходе» у всех выживших.
  let finalState = moved;
  if (moved.phase === 'ending') {
    for (const p of moved.players.filter((pl) => pl.alive)) {
      finalState = applyOnSurvived(finalState, p, rng);
    }
  }
  return { ...finalState, votes: {}, turn: 0 };
}

const BOT_NAMES = ['Бот Гена', 'Бот Люся', 'Бот Клава', 'Бот Пётр', 'Бот Зина', 'Бот Макс', 'Бот Рита', 'Бот Фёдор'];

/** Добавляет бота-игрока в лобби. */
export function addBot(state: RoomState, rng: () => number): RoomState {
  const n = state.players.filter((p) => p.isBot).length;
  const name = BOT_NAMES[n % BOT_NAMES.length];
  const id = `bot-${n}-${Math.floor(rng() * 1e6)}`;
  return { ...state, players: [...state.players, { id, name, alive: true, revealed: [], isBot: true }] };
}

/** Каждый живой бот раскрывает одну ещё не раскрытую характеристику. */
export function autoRevealBots(state: RoomState, rng: () => number): RoomState {
  let s = state;
  for (const p of state.players) {
    if (!p.isBot || !p.alive) continue;
    const hidden = CATEGORIES.filter((c) => !p.revealed.includes(c));
    if (hidden.length === 0) continue;
    const cat = hidden[Math.floor(rng() * hidden.length)];
    s = revealTrait(s, p.id, cat);
  }
  return s;
}

/** Каждый живой бот голосует за случайного живого игрока, кроме себя. */
export function autoVoteBots(state: RoomState, rng: () => number): RoomState {
  let s = state;
  const alive = state.players.filter((p) => p.alive);
  for (const bot of alive) {
    if (!bot.isBot) continue;
    const targets = alive.filter((p) => p.id !== bot.id);
    if (targets.length === 0) continue;
    const target = targets[Math.floor(rng() * targets.length)];
    s = castVote(s, bot.id, target.id);
  }
  return s;
}

/** Финал: считает концовку по выжившим. */
export function finishGame(state: RoomState, rng: () => number): RoomState {
  const survivors = (state.characters ?? []).filter((c) => state.players.find((p) => p.id === c.playerId)?.alive);
  const scenario = state.scenario ?? pickScenario(state.players.length, rng);
  const ending = generateEnding(survivors, scenario, rng);
  return { ...state, phase: 'ending', ending };
}
