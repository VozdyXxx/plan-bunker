import type { Category, Trait } from '../types';
import profession from './profession.json';
import biology from './biology.json';
import health from './health.json';
import hobby from './hobby.json';
import baggage from './baggage.json';
import fact from './fact.json';
import phobia from './phobia.json';
import trait from './trait.json';
import special from './special.json';

let cache: Record<Category, Trait[]> | null = null;

export function loadContent(): Record<Category, Trait[]> {
  if (!cache) {
    cache = {
      profession,
      biology,
      health,
      hobby,
      baggage,
      fact,
      phobia,
      trait,
      special,
    } as Record<Category, Trait[]>;
  }
  return cache;
}
