export interface AdapterEnv {
  VITE_SERVER_URL?: string;
  DEV?: boolean;
}

/**
 * Какой сетевой слой использовать.
 * - 'memory' если явно задано VITE_SERVER_URL=memory, или в dev без заданного URL (локальное превью без бэкенда).
 * - 'socket' во всех остальных случаях, включая production-сборку с пустым URL (тот же origin, что отдал страницу).
 */
export function adapterMode(env: AdapterEnv): 'memory' | 'socket' {
  const url = env.VITE_SERVER_URL?.trim() ?? '';
  if (url === 'memory') return 'memory';
  if (url !== '') return 'socket';
  return env.DEV ? 'memory' : 'socket';
}
