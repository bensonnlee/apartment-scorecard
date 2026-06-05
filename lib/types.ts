export type CatKey =
  | 'location'
  | 'interior'
  | 'building'
  | 'cost'
  | 'practical'
  | 'vibe';

export type Rating = 1 | 2 | 3 | 4 | 5;
export type WeightValue = 1 | 2 | 3;

export interface Apartment {
  id: string;
  name: string;
  rent?: number;
  scores: Partial<Record<CatKey, Rating>>;
  checks: Record<string, boolean>; // key = `${CatKey}:${itemIndex}`
  dealbreaker?: boolean;
  notes: string;
}

export type Weights = Record<CatKey, WeightValue>;

export interface AppState {
  apartments: Apartment[];
  weights: Weights;
  budget?: number;
}

export interface Category {
  key: CatKey;
  icon: string;
  name: string;
  items: string[];
}
