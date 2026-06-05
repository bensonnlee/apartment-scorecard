import type { Apartment, Weights } from './types';
import { CATEGORIES } from './categories';

export function score(apt: Apartment, weights: Weights): number {
  let got = 0;
  let max = 0;
  for (const c of CATEGORIES) {
    const rating = apt.scores[c.key];
    if (rating) {
      const w = weights[c.key];
      got += rating * w;
      max += 5 * w;
    }
  }
  return max > 0 ? Math.round((got / max) * 100) : 0;
}

export function ratedCount(apt: Apartment): number {
  return CATEGORIES.filter((c) => apt.scores[c.key]).length;
}

export function isOverBudget(apt: Apartment, budget?: number): boolean {
  return typeof budget === 'number' && typeof apt.rent === 'number' && apt.rent > budget;
}

export function rankApartments(apartments: Apartment[], weights: Weights): Apartment[] {
  return [...apartments].sort((a, b) => {
    const aDeal = a.dealbreaker ? 1 : 0;
    const bDeal = b.dealbreaker ? 1 : 0;
    if (aDeal !== bDeal) return aDeal - bDeal; // non-dealbreakers first
    return score(b, weights) - score(a, weights);
  });
}
