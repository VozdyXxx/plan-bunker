import type { RoomState } from './types';

/** Переход к следующей фазе: lobby → round → vote → round … → ending (когда живых == мест). */
export function nextPhase(state: RoomState): RoomState {
  const alive = state.players.filter((p) => p.alive).length;
  switch (state.phase) {
    case 'lobby':
      return { ...state, phase: 'round', round: 1 };
    case 'round':
      return { ...state, phase: 'vote' };
    case 'vote':
      if (alive <= state.spots) return { ...state, phase: 'ending' };
      return { ...state, phase: 'round', round: state.round + 1 };
    case 'ending':
      return state;
  }
}
