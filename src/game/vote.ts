import type { Player } from './types';

export interface VoteResult {
  /** id выбывшего; null — валидных голосов не было, никого не выгоняем. */
  eliminated: string | null;
  tie: boolean;
}

/** Подсчёт голосов. votes: id голосующего → id цели. Ничья разрешается наименьшим id. */
export function tallyVotes(votes: Record<string, string>, players: Player[]): VoteResult {
  const aliveIds = new Set(players.filter((p) => p.alive).map((p) => p.id));
  const counts = new Map<string, number>();
  for (const target of Object.values(votes)) {
    if (!aliveIds.has(target)) continue; // нельзя голосовать за выбывшего
    counts.set(target, (counts.get(target) ?? 0) + 1);
  }

  let max = -1;
  let leaders: string[] = [];
  for (const [id, c] of counts) {
    if (c > max) {
      max = c;
      leaders = [id];
    } else if (c === max) {
      leaders.push(id);
    }
  }

  if (leaders.length === 0) {
    return { eliminated: null, tie: false }; // никто не проголосовал — никого не выгоняем
  }

  leaders.sort();
  return { eliminated: leaders[0], tie: leaders.length > 1 };
}
