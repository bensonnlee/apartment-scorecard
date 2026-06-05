import { describe, it, expect, beforeEach } from 'vitest';
import { loadState, saveState, STORAGE_KEY } from './storage';
import { DEFAULT_WEIGHTS } from './categories';
import type { AppState } from './types';

beforeEach(() => {
  window.localStorage.clear();
});

describe('storage', () => {
  it('returns empty defaults when nothing is stored', () => {
    const state = loadState();
    expect(state.apartments).toEqual([]);
    expect(state.weights).toEqual(DEFAULT_WEIGHTS);
    expect(state.budget).toBeUndefined();
  });

  it('round-trips a saved state', () => {
    const state: AppState = {
      apartments: [{ id: 'a', name: 'Oak St', scores: { location: 4 }, checks: {}, notes: 'nice' }],
      weights: { ...DEFAULT_WEIGHTS, cost: 1 },
      budget: 1800,
    };
    saveState(state);
    expect(loadState()).toEqual(state);
  });

  it('merges stored weights over defaults for forward-compat', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ apartments: [], weights: { location: 1 } }));
    const state = loadState();
    expect(state.weights.location).toBe(1);
    expect(state.weights.interior).toBe(DEFAULT_WEIGHTS.interior);
  });

  it('falls back to defaults on corrupt JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not valid');
    const state = loadState();
    expect(state.apartments).toEqual([]);
    expect(state.weights).toEqual(DEFAULT_WEIGHTS);
  });
});
