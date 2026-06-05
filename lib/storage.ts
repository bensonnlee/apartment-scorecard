import type { AppState } from './types';
import { DEFAULT_WEIGHTS } from './categories';

export const STORAGE_KEY = 'apartment-scorecard:v1';

export function emptyState(): AppState {
  return { apartments: [], weights: { ...DEFAULT_WEIGHTS } };
}

export function loadState(): AppState {
  if (typeof window === 'undefined') return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      apartments: parsed.apartments ?? [],
      weights: { ...DEFAULT_WEIGHTS, ...(parsed.weights ?? {}) },
      budget: parsed.budget,
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / privacy-mode errors
  }
}
