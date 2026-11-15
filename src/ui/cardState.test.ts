import { describe, it, expect } from 'vitest';
import { cardDisplay } from './cardState';

describe('cardDisplay', () => {
  it('раскрытая карта: текст виден всем, пометка «Открыто», раскрыть нельзя', () => {
    expect(cardDisplay(true, false)).toEqual({ showText: true, canReveal: false, badge: 'open' });
    expect(cardDisplay(true, true)).toEqual({ showText: true, canReveal: false, badge: 'open' });
  });

  it('своя нераскрытая: текст виден владельцу, можно раскрыть', () => {
    expect(cardDisplay(false, true)).toEqual({ showText: true, canReveal: true, badge: 'private' });
  });

  it('чужая нераскрытая: скрыта', () => {
    expect(cardDisplay(false, false)).toEqual({ showText: false, canReveal: false, badge: 'hidden' });
  });
});
