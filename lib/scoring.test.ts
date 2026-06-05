import { describe, it, expect } from 'vitest';
import { score, ratedCount, isOverBudget, rankApartments } from './scoring';
import { DEFAULT_WEIGHTS } from './categories';
import type { Apartment } from './types';

function make(overrides: Partial<Apartment> = {}): Apartment {
  return { id: 'x', name: '', scores: {}, checks: {}, notes: '', ...overrides };
}

describe('score', () => {
  it('returns 0 when nothing is rated', () => {
    expect(score(make(), DEFAULT_WEIGHTS)).toBe(0);
  });

  it('returns 100 when all categories are rated 5', () => {
    const apt = make({
      scores: { location: 5, interior: 5, building: 5, cost: 5, practical: 5, vibe: 5 },
    });
    expect(score(apt, DEFAULT_WEIGHTS)).toBe(100);
  });

  it('divides by rated-category max only (spec formula)', () => {
    // location rated 4, weight 3 => got 12, max 15 => 80
    expect(score(make({ scores: { location: 4 } }), DEFAULT_WEIGHTS)).toBe(80);
  });

  it('weights multiple rated categories correctly', () => {
    // location 3 (w3)=9, interior 4 (w3)=12 => got 21, max 30 => 70
    const apt = make({ scores: { location: 3, interior: 4 } });
    expect(score(apt, DEFAULT_WEIGHTS)).toBe(70);
  });
});

describe('ratedCount', () => {
  it('counts categories that have a score', () => {
    expect(ratedCount(make({ scores: { location: 1, vibe: 5 } }))).toBe(2);
    expect(ratedCount(make())).toBe(0);
  });
});

describe('isOverBudget', () => {
  it('is true when rent exceeds budget', () => {
    expect(isOverBudget(make({ rent: 2000 }), 1500)).toBe(true);
  });
  it('is false when rent is within budget', () => {
    expect(isOverBudget(make({ rent: 1400 }), 1500)).toBe(false);
  });
  it('is false when budget or rent is missing', () => {
    expect(isOverBudget(make({ rent: 2000 }), undefined)).toBe(false);
    expect(isOverBudget(make(), 1500)).toBe(false);
  });
});

describe('rankApartments', () => {
  it('sorts by score descending', () => {
    const a = make({ id: 'a', scores: { location: 5 } }); // 100
    const b = make({ id: 'b', scores: { location: 3 } }); // 60
    const result = rankApartments([b, a], DEFAULT_WEIGHTS);
    expect(result.map((x) => x.id)).toEqual(['a', 'b']);
  });

  it('sinks dealbreakers to the bottom regardless of score', () => {
    const a = make({ id: 'a', scores: { location: 3 } }); // 60
    const db = make({ id: 'db', scores: { location: 5 }, dealbreaker: true }); // 100 but sunk
    const result = rankApartments([db, a], DEFAULT_WEIGHTS);
    expect(result.map((x) => x.id)).toEqual(['a', 'db']);
  });
});
