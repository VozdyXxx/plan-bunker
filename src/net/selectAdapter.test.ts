import { test, expect } from 'vitest';
import { adapterMode } from './selectAdapter';

test('explicit "memory" forces the memory adapter', () => {
  expect(adapterMode({ VITE_SERVER_URL: 'memory', DEV: false })).toBe('memory');
});

test('a real server URL selects the socket adapter', () => {
  expect(adapterMode({ VITE_SERVER_URL: 'https://x.sslip.io', DEV: false })).toBe('socket');
});

test('empty URL in a production build selects socket (same origin) — the deploy case', () => {
  expect(adapterMode({ VITE_SERVER_URL: '', DEV: false })).toBe('socket');
  expect(adapterMode({ DEV: false })).toBe('socket');
});

test('empty URL in dev selects memory so local preview works without a backend', () => {
  expect(adapterMode({ VITE_SERVER_URL: '', DEV: true })).toBe('memory');
});
