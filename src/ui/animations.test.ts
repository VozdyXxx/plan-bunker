import { test, expect } from 'vitest';
import { anim } from './animations';

test('every preset exists and runs on a target without throwing', () => {
  const el = {} as unknown as HTMLElement;
  expect(() => anim.flip(el)).not.toThrow();
  expect(() => anim.reveal(el)).not.toThrow();
  expect(() => anim.tilt(el, 0.5, -0.5)).not.toThrow();
  expect(() => anim.voteOut(el)).not.toThrow();
  expect(() => anim.endingType(el)).not.toThrow();
});
